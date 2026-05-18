const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Create new user (Admin, Manager, Staff)
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, name, role, managerId } = req.body;

    if (!username || !email || !password || !name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
        role,
        managerId: role === 'STAFF' ? managerId : null
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          manager: { select: { id: true, name: true } },
          _count: {
            select: {
              assignedLeads: true,
              callLogs: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, isActive, managerId } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { name, email, isActive, managerId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({ where: { id } });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalLeads,
      totalUsers,
      totalCallLogs,
      leadsByStage,
      recentUploads
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.user.count(),
      prisma.callLog.count(),
      prisma.lead.groupBy({
        by: ['stage'],
        _count: true
      }),
      prisma.excelUpload.findMany({
        take: 5,
        orderBy: { uploadedAt: 'desc' },
        include: {
          loanCategory: { select: { name: true } }
        }
      })
    ]);

    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    res.json({
      totalLeads,
      totalUsers,
      totalCallLogs,
      leadsByStage,
      usersByRole,
      recentUploads
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Manage loan categories
exports.createLoanCategory = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    const category = await prisma.loanCategory.create({
      data: { name, code, description }
    });

    res.status(201).json({ message: 'Loan category created', category });
  } catch (error) {
    console.error('Create loan category error:', error);
    res.status(500).json({ error: 'Failed to create loan category' });
  }
};

exports.getLoanCategories = async (req, res) => {
  try {
    const categories = await prisma.loanCategory.findMany({
      include: {
        _count: { select: { leads: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.json(categories);
  } catch (error) {
    console.error('Get loan categories error:', error);
    res.status(500).json({ error: 'Failed to fetch loan categories' });
  }
};
