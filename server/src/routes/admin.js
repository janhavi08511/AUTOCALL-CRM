const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, adminOnly } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const moment = require('moment');

const router = express.Router();
const prisma = new PrismaClient();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(adminOnly);

// ============= DASHBOARD KPIs =============
router.get('/dashboard/kpi', async (req, res) => {
  try {
    const [
      totalLeads,
      totalCalls,
      connectedCalls,
      notConnectedCalls,
      todayCalls,
      activeStaff,
      activeManagers,
      totalUploads,
      leadsUploadedToday
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.callLog.count(),
      prisma.callLog.count({ where: { callResult: 'CONNECTED' } }),
      prisma.callLog.count({ where: { callResult: { not: 'CONNECTED' } } }),
      prisma.callLog.count({
        where: {
          createdAt: {
            gte: moment().startOf('day').toDate()
          }
        }
      }),
      prisma.user.count({
        where: { role: 'STAFF', isActive: true }
      }),
      prisma.user.count({
        where: { role: 'MANAGER', isActive: true }
      }),
      prisma.excelUpload.count(),
      prisma.lead.count({
        where: {
          createdAt: {
            gte: moment().startOf('day').toDate()
          }
        }
      })
    ]);

    // Get leads by loan type
    const leadsByLoanType = await prisma.lead.groupBy({
      by: ['loanCategoryId'],
      _count: true,
      orderBy: {
        _count: {
          loanCategoryId: 'desc'
        }
      },
      take: 5
    });

    const loanTypeDetails = await Promise.all(
      leadsByLoanType.map(async (item) => {
        const category = await prisma.loanCategory.findUnique({
          where: { id: item.loanCategoryId },
          select: { name: true, code: true }
        });
        return {
          name: category?.name || 'Unknown',
          code: category?.code || 'N/A',
          count: item._count
        };
      })
    );

    res.json({
      totalLeads,
      totalCalls,
      connectedCalls,
      notConnectedCalls,
      todayCalls,
      activeStaff,
      activeManagers,
      totalUploads,
      leadsUploadedToday,
      leadsByLoanType: loanTypeDetails
    });
  } catch (error) {
    console.error('KPI error:', error);
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

// ============= LOAN CATEGORY MANAGEMENT =============
router.get('/loan-categories', async (req, res) => {
  try {
    const categories = await prisma.loanCategory.findMany({
      include: {
        _count: {
          select: { leads: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(categories);
  } catch (error) {
    console.error('Loan categories error:', error);
    res.status(500).json({ error: 'Failed to fetch loan categories' });
  }
});

router.post('/loan-categories', async (req, res) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    const category = await prisma.loanCategory.create({
      data: { name, code, description }
    });

    res.json(category);
  } catch (error) {
    console.error('Create loan category error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Name or code already exists' });
    }
    res.status(500).json({ error: 'Failed to create loan category' });
  }
});

router.put('/loan-categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, isActive } = req.body;

    const category = await prisma.loanCategory.update({
      where: { id },
      data: { name, code, description, isActive }
    });

    res.json(category);
  } catch (error) {
    console.error('Update loan category error:', error);
    res.status(500).json({ error: 'Failed to update loan category' });
  }
});

// ============= USER MANAGEMENT =============
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const where = role ? { role: role.toUpperCase() } : {};

    const users = await prisma.user.findMany({
      where,
      include: {
        manager: {
          select: { id: true, name: true }
        },
        _count: {
          select: { staff: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { username, email, password, name, role, managerId } = req.body;

    if (!username || !email || !password || !name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      username,
      email,
      password: hashedPassword,
      name,
      role: role.toUpperCase()
    };

    // Add managerId for staff users
    if (role.toUpperCase() === 'STAFF' && managerId) {
      userData.managerId = managerId;
    }

    const user = await prisma.user.create({
      data: userData,
      include: {
        manager: {
          select: { id: true, name: true }
        }
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, name, role, isActive, managerId } = req.body;

    const updateData = {
      username,
      email,
      name,
      role: role.toUpperCase(),
      isActive
    };

    // Add managerId for staff users
    if (role.toUpperCase() === 'STAFF' && managerId) {
      updateData.managerId = managerId;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        manager: {
          select: { id: true, name: true }
        }
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ============= LEAD OVERSIGHT (READ-ONLY) =============
router.get('/leads', async (req, res) => {
  try {
    const {
      loanType,
      city,
      manager,
      staff,
      stage,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const where = {};

    if (loanType) {
      where.loanCategoryId = loanType;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (stage) {
      where.stage = stage.toUpperCase();
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Filter by manager (uploaded by)
    if (manager) {
      where.uploadedBy = manager;
    }

    // Filter by staff (assigned to)
    if (staff) {
      where.assignedTo = staff;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          loanCategory: {
            select: { id: true, name: true, code: true }
          },
          uploader: {
            select: { id: true, name: true }
          },
          assignee: {
            select: { id: true, name: true }
          },
          _count: {
            select: { callLogs: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.lead.count({ where })
    ]);

    // Mask phone numbers for security
    const maskedLeads = leads.map(lead => ({
      ...lead,
      phone: lead.phone.replace(/(\d{5})\d{5}(\d{1})/, '$1XXXXX$2')
    }));

    res.json({
      leads: maskedLeads,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// ============= CALL MONITORING =============
router.get('/call-logs', async (req, res) => {
  try {
    const {
      staff,
      loanType,
      date,
      callResult,
      page = 1,
      limit = 50
    } = req.query;

    const where = {};

    if (staff) {
      where.staffId = staff;
    }

    if (callResult) {
      where.callResult = callResult.toUpperCase();
    }

    if (date) {
      const startOfDay = moment(date).startOf('day').toDate();
      const endOfDay = moment(date).endOf('day').toDate();
      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    // If loanType is specified, join with leads
    if (loanType) {
      where.lead = {
        loanCategoryId: loanType
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [callLogs, total] = await Promise.all([
      prisma.callLog.findMany({
        where,
        include: {
          lead: {
            include: {
              loanCategory: {
                select: { id: true, name: true, code: true }
              }
            }
          },
          staff: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.callLog.count({ where })
    ]);

    // Mask phone numbers
    const maskedCallLogs = callLogs.map(log => ({
      ...log,
      lead: {
        ...log.lead,
        phone: log.lead.phone.replace(/(\d{5})\d{5}(\d{1})/, '$1XXXXX$2')
      }
    }));

    res.json({
      callLogs: maskedCallLogs,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Call logs error:', error);
    res.status(500).json({ error: 'Failed to fetch call logs' });
  }
});

// ============= STAFF SESSION MONITORING =============
router.get('/staff-sessions', async (req, res) => {
  try {
    const sessions = await prisma.staffSession.findMany({
      include: {
        staff: {
          select: { id: true, name: true }
        }
      },
      orderBy: { loginTime: 'desc' },
      take: 100 // Last 100 sessions
    });

    res.json(sessions);
  } catch (error) {
    console.error('Staff sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch staff sessions' });
  }
});

router.get('/staff-status', async (req, res) => {
  try {
    const activeStaff = await prisma.user.findMany({
      where: { role: 'STAFF', isActive: true },
      include: {
        sessions: {
          where: { logoutTime: null },
          orderBy: { loginTime: 'desc' },
          take: 1
        }
      }
    });

    const staffStatus = activeStaff.map(staff => {
      const currentSession = staff.sessions[0];
      return {
        id: staff.id,
        name: staff.name,
        status: currentSession ? currentSession.status : 'OFFLINE',
        loginTime: currentSession?.loginTime,
        totalWorkTime: currentSession?.totalWorkTime,
        totalBreakTime: currentSession?.totalBreakTime
      };
    });

    res.json(staffStatus);
  } catch (error) {
    console.error('Staff status error:', error);
    res.status(500).json({ error: 'Failed to fetch staff status' });
  }
});

module.exports = router;
