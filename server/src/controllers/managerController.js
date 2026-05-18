const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Dashboard KPIs
exports.getDashboardStats = async (req, res) => {
  try {
    const managerId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLeads, callsToday, connectedCalls, notConnectedCalls, followUpsPending, retryScheduled, activeStaff] = await Promise.all([
      prisma.lead.count({ where: { uploadedBy: managerId } }),
      prisma.callLog.count({ where: { createdAt: { gte: today }, staff: { managerId } } }),
      prisma.callLog.count({ where: { callResult: 'CONNECTED', staff: { managerId } } }),
      prisma.callLog.count({ where: { callResult: { in: ['NOT_CONNECTED', 'NO_ANSWER', 'BUSY'] }, staff: { managerId } } }),
      prisma.lead.count({ where: { stage: 'FOLLOW_UP', uploadedBy: managerId } }),
      prisma.lead.count({ where: { nextRetryAt: { not: null }, uploadedBy: managerId } }),
      prisma.staffSession.count({ where: { status: 'ACTIVE', staff: { managerId } } })
    ]);

    res.json({
      totalLeads,
      callsToday,
      connectedCalls,
      notConnectedCalls,
      followUpsPending,
      retryScheduled,
      activeStaff
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Chart Data
exports.getChartData = async (req, res) => {
  try {
    const managerId = req.user.id;

    const [callsByResult, leadsByLoanType, staffPerformance] = await Promise.all([
      prisma.callLog.groupBy({
        by: ['callResult'],
        where: { staff: { managerId } },
        _count: true
      }),
      prisma.lead.groupBy({
        by: ['loanCategoryId'],
        where: { uploadedBy: managerId },
        _count: true
      }),
      prisma.user.findMany({
        where: { managerId, role: 'STAFF' },
        select: {
          id: true,
          name: true,
          _count: { select: { callLogs: true } }
        }
      })
    ]);

    const loanCategories = await prisma.loanCategory.findMany({
      where: { id: { in: leadsByLoanType.map(l => l.loanCategoryId) } }
    });

    res.json({
      callsByResult: callsByResult.map(c => ({ result: c.callResult, count: c._count })),
      leadsByLoanType: leadsByLoanType.map(l => ({
        loanType: loanCategories.find(cat => cat.id === l.loanCategoryId)?.name || 'Unknown',
        count: l._count
      })),
      staffPerformance: staffPerformance.map(s => ({ name: s.name, calls: s._count.callLogs }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Active Loan Categories
exports.getLoanCategories = async (req, res) => {
  try {
    const categories = await prisma.loanCategory.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload Excel with Loan Type
exports.uploadExcel = async (req, res) => {
  try {
    const { loanCategoryId, leads } = req.body;
    const managerId = req.user.id;

    if (!loanCategoryId) {
      return res.status(400).json({ error: 'Loan Type is required' });
    }

    if (!leads || leads.length === 0) {
      return res.status(400).json({ error: 'No leads provided' });
    }

    if (leads.length > 50000) {
      return res.status(400).json({ error: 'Maximum 50,000 records allowed' });
    }

    const loanCategory = await prisma.loanCategory.findUnique({
      where: { id: loanCategoryId, isActive: true }
    });

    if (!loanCategory) {
      return res.status(400).json({ error: 'Invalid Loan Category' });
    }

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const lead of leads) {
      try {
        if (!lead.phone) {
          failedCount++;
          errors.push({ row: lead.row, error: 'Phone number required' });
          continue;
        }

        await prisma.lead.create({
          data: {
            name: lead.name || 'Unknown',
            phone: lead.phone,
            email: lead.email,
            city: lead.city || 'Unknown',
            state: lead.state,
            loanCategoryId,
            uploadedBy: managerId
          }
        });
        successCount++;
      } catch (err) {
        failedCount++;
        if (err.code === 'P2002') {
          errors.push({ row: lead.row, error: 'Duplicate phone number' });
        } else {
          errors.push({ row: lead.row, error: err.message });
        }
      }
    }

    await prisma.excelUpload.create({
      data: {
        filename: req.body.filename || 'upload.xlsx',
        totalRecords: leads.length,
        successfulRecords: successCount,
        failedRecords: failedCount,
        uploadedBy: managerId,
        loanCategoryId
      }
    });

    res.json({ successCount, failedCount, errors: errors.slice(0, 100) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Unassigned Leads with Filters
exports.getUnassignedLeads = async (req, res) => {
  try {
    const { city, loanCategoryId } = req.query;
    const managerId = req.user.id;

    const where = {
      uploadedBy: managerId,
      assignedTo: null
    };

    if (city) where.city = city;
    if (loanCategoryId) where.loanCategoryId = loanCategoryId;

    const leads = await prisma.lead.findMany({
      where,
      include: { loanCategory: true },
      take: 1000
    });

    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Staff List
exports.getStaffList = async (req, res) => {
  try {
    const managerId = req.user.id;

    const staff = await prisma.user.findMany({
      where: { managerId, role: 'STAFF', isActive: true },
      select: { id: true, name: true, username: true }
    });

    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Auto Assign Leads
exports.autoAssignLeads = async (req, res) => {
  try {
    const { filters, staffIds } = req.body;
    const managerId = req.user.id;

    if (!staffIds || staffIds.length === 0) {
      return res.status(400).json({ error: 'No staff selected' });
    }

    const where = {
      uploadedBy: managerId,
      assignedTo: null
    };

    if (filters.city) where.city = filters.city;
    if (filters.loanCategoryId) where.loanCategoryId = filters.loanCategoryId;

    const leads = await prisma.lead.findMany({ where });

    if (leads.length === 0) {
      return res.status(400).json({ error: 'No leads to assign' });
    }

    const leadsPerStaff = Math.ceil(leads.length / staffIds.length);
    let assignedCount = 0;

    for (let i = 0; i < staffIds.length; i++) {
      const staffLeads = leads.slice(i * leadsPerStaff, (i + 1) * leadsPerStaff);
      
      await prisma.lead.updateMany({
        where: { id: { in: staffLeads.map(l => l.id) } },
        data: { assignedTo: staffIds[i] }
      });

      assignedCount += staffLeads.length;
    }

    res.json({ assignedCount, totalStaff: staffIds.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Live Staff Monitoring
exports.getStaffMonitoring = async (req, res) => {
  try {
    const managerId = req.user.id;

    const staff = await prisma.user.findMany({
      where: { managerId, role: 'STAFF' },
      select: {
        id: true,
        name: true,
        sessions: {
          orderBy: { loginTime: 'desc' },
          take: 1,
          select: {
            status: true,
            loginTime: true,
            totalWorkTime: true,
            totalBreakTime: true
          }
        },
        _count: {
          select: {
            callLogs: {
              where: {
                createdAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
              }
            }
          }
        }
      }
    });

    res.json(staff.map(s => ({
      id: s.id,
      name: s.name,
      status: s.sessions[0]?.status || 'OFFLINE',
      workTime: s.sessions[0]?.totalWorkTime || 0,
      breakTime: s.sessions[0]?.totalBreakTime || 0,
      callsToday: s._count.callLogs
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Qualification Dashboard
exports.getQualificationDashboard = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { city, loanCategoryId, qualification, staffId } = req.query;

    const where = { uploadedBy: managerId };
    if (city) where.city = city;
    if (loanCategoryId) where.loanCategoryId = loanCategoryId;
    if (qualification) where.qualification = qualification;
    if (staffId) where.assignedTo = staffId;

    const [hot, warm, cold, unqualified, leads, qualificationTrend] = await Promise.all([
      prisma.lead.count({ where: { ...where, qualification: 'HOT' } }),
      prisma.lead.count({ where: { ...where, qualification: 'WARM' } }),
      prisma.lead.count({ where: { ...where, qualification: 'COLD' } }),
      prisma.lead.count({ where: { ...where, qualification: 'UNQUALIFIED' } }),
      prisma.lead.findMany({
        where,
        include: {
          loanCategory: { select: { name: true } },
          assignee: { select: { name: true } },
          pendingDetails: { take: 1, orderBy: { createdAt: 'desc' } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 100
      }),
      prisma.lead.groupBy({
        by: ['qualification'],
        where: { uploadedBy: managerId },
        _count: true
      })
    ]);

    // Last 7 days trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentQualified = await prisma.lead.findMany({
      where: { uploadedBy: managerId, qualification: { not: 'UNQUALIFIED' }, updatedAt: { gte: sevenDaysAgo } },
      select: { qualification: true, updatedAt: true }
    });

    const trendByDay = {};
    recentQualified.forEach(l => {
      const day = l.updatedAt.toISOString().split('T')[0];
      if (!trendByDay[day]) trendByDay[day] = { HOT: 0, WARM: 0, COLD: 0 };
      trendByDay[day][l.qualification] = (trendByDay[day][l.qualification] || 0) + 1;
    });

    res.json({
      stats: { hot, warm, cold, unqualified },
      leads: leads.map(l => ({
        id: l.id,
        name: l.name,
        phone: l.phone.substring(0, 5) + 'XXXXX',
        city: l.city,
        loanType: l.loanCategory.name,
        stage: l.stage,
        qualification: l.qualification,
        staffName: l.assignee?.name || 'Unassigned',
        pendingDetail: l.pendingDetails[0] || null
      })),
      charts: {
        qualificationRatio: qualificationTrend.map(q => ({ label: q.qualification, value: q._count })),
        conversionTrend: Object.entries(trendByDay).sort().map(([date, counts]) => ({ date, ...counts }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reports with Filters
exports.getReports = async (req, res) => {
  try {
    const { loanCategoryId, staffId, startDate, endDate, callResult } = req.query;
    const managerId = req.user.id;

    const where = {
      staff: { managerId }
    };

    if (startDate) where.createdAt = { gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    if (callResult) where.callResult = callResult;
    if (staffId) where.staffId = staffId;

    const callLogs = await prisma.callLog.findMany({
      where,
      include: {
        lead: { include: { loanCategory: true } },
        staff: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const filtered = loanCategoryId 
      ? callLogs.filter(c => c.lead.loanCategoryId === loanCategoryId)
      : callLogs;

    res.json(filtered.map(c => ({
      id: c.id,
      leadName: c.lead.name,
      leadPhone: c.lead.phone,
      loanType: c.lead.loanCategory.name,
      staffName: c.staff.name,
      callResult: c.callResult,
      duration: c.callDuration,
      date: c.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
