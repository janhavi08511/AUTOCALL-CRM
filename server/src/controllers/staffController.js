const prisma = require('../db');

// Get assigned leads (phone masked)
exports.getAssignedLeads = async (req, res) => {
  try {
    const { page = 1, limit = 20, stage } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { assignedTo: req.user.id };
    if (stage) where.stage = stage;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: { loanCategory: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.lead.count({ where })
    ]);

    const maskedLeads = leads.map(lead => ({
      ...lead,
      phone: lead.phone.substring(0, 5) + 'XXXXX'
    }));

    res.json({
      leads: maskedLeads,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assigned leads' });
  }
};

// Get full phone for calling
exports.getLeadPhone = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findFirst({
      where: { id, assignedTo: req.user.id },
      select: { id: true, phone: true, name: true }
    });

    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ phone: lead.phone, name: lead.name });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch phone' });
  }
};

// Update call status
exports.updateCallStatus = async (req, res) => {
  try {
    const { leadId, callResult, customerResponse, notes, callDuration } = req.body;

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, assignedTo: req.user.id }
    });

    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const callLog = await prisma.callLog.create({
      data: {
        leadId,
        staffId: req.user.id,
        callResult,
        customerResponse,
        notes,
        callDuration: callDuration || 0,
        attemptNumber: lead.retryCount + 1
      }
    });

    let updateData = { retryCount: lead.retryCount + 1 };

    if (callResult === 'CONNECTED') {
      if (customerResponse === 'INTERESTED') updateData.stage = 'INTERESTED';
      else if (customerResponse === 'NOT_INTERESTED') {
        updateData.stage = 'NOT_INTERESTED';
        updateData.isCompleted = true;
      } else if (customerResponse === 'FOLLOW_UP') updateData.stage = 'FOLLOW_UP';
    } else {
      updateData.stage = 'CONTACTED';
      if (lead.retryCount < 3) {
        const nextRetry = new Date();
        nextRetry.setHours(nextRetry.getHours() + 2);
        updateData.nextRetryAt = nextRetry;
      }
    }

    await prisma.lead.update({ where: { id: leadId }, data: updateData });

    res.json({ message: 'Call status updated', callLog });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update call status' });
  }
};

// Staff dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalAssigned, callsToday, pendingLeads, followUps] = await Promise.all([
      prisma.lead.count({ where: { assignedTo: req.user.id } }),
      prisma.callLog.count({ where: { staffId: req.user.id, createdAt: { gte: today } } }),
      prisma.lead.count({ where: { assignedTo: req.user.id, stage: 'NEW' } }),
      prisma.lead.count({ where: { assignedTo: req.user.id, stage: 'FOLLOW_UP' } })
    ]);

    res.json({ totalAssigned, callsToday, pendingLeads, followUps });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// Save Pending Details after call
exports.savePendingDetails = async (req, res) => {
  try {
    const { leadId, emiBankName, existingEmi, monthlyIncome, occupation, loanRequirement, cibilScore, notes, followUpDate } = req.body;

    const lead = await prisma.lead.findFirst({
      where: { id: leadId, assignedTo: req.user.id }
    });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Determine qualification
    let qualification = 'COLD';
    if (lead.stage === 'NOT_INTERESTED') {
      qualification = 'COLD';
    } else if (lead.stage === 'FOLLOW_UP' || followUpDate) {
      qualification = 'WARM';
    } else if (lead.stage === 'INTERESTED' && monthlyIncome && monthlyIncome >= 25000) {
      qualification = 'HOT';
    } else if (lead.stage === 'INTERESTED') {
      qualification = 'WARM';
    }

    const [pendingDetail] = await Promise.all([
      prisma.pendingDetail.upsert({
        where: { leadId },
        update: { emiBankName, existingEmi: existingEmi ? parseFloat(existingEmi) : null, monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null, occupation, loanRequirement: loanRequirement ? parseFloat(loanRequirement) : null, cibilScore: cibilScore ? parseInt(cibilScore) : null, notes, followUpDate: followUpDate ? new Date(followUpDate) : null, staffId: req.user.id },
        create: { leadId, staffId: req.user.id, emiBankName, existingEmi: existingEmi ? parseFloat(existingEmi) : null, monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null, occupation, loanRequirement: loanRequirement ? parseFloat(loanRequirement) : null, cibilScore: cibilScore ? parseInt(cibilScore) : null, notes, followUpDate: followUpDate ? new Date(followUpDate) : null }
      }),
      prisma.lead.update({ where: { id: leadId }, data: { qualification } })
    ]);

    res.json({ message: 'Pending details saved', pendingDetail, qualification });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save pending details' });
  }
};

// Get call history
exports.getCallHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [callLogs, total] = await Promise.all([
      prisma.callLog.findMany({
        where: { staffId: req.user.id },
        include: { lead: { include: { loanCategory: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.callLog.count({ where: { staffId: req.user.id } })
    ]);

    res.json({
      callLogs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
};
