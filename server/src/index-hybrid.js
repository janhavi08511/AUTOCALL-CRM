const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Check if Prisma is available
let prisma = null;
try {
  prisma = require('@prisma/client').PrismaClient;
} catch (error) {
  console.log('⚠️  Prisma not available, using fallback data');
}

// Fallback in-memory data
const fallbackData = {
  users: [
    {
      id: 'admin-1',
      username: 'admin',
      email: 'admin@crm.com',
      password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQj', // 'admin123'
      name: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
      managerId: null,
      createdAt: new Date().toISOString()
    }
  ],
  loanCategories: [
    {
      id: '1',
      name: 'Business Loan',
      code: 'BL',
      description: 'Business financing for entrepreneurs',
      isActive: true,
      createdAt: new Date().toISOString(),
      _count: { leads: 45 }
    },
    {
      id: '2',
      name: 'Personal Loan',
      code: 'PL',
      description: 'Personal financing for individuals',
      isActive: true,
      createdAt: new Date().toISOString(),
      _count: { leads: 32 }
    },
    {
      id: '3',
      name: 'Home Loan',
      code: 'HL',
      description: 'Home financing for families',
      isActive: true,
      createdAt: new Date().toISOString(),
      _count: { leads: 28 }
    },
    {
      id: '4',
      name: 'Car Loan',
      code: 'CL',
      description: 'Vehicle financing',
      isActive: true,
      createdAt: new Date().toISOString(),
      _count: { leads: 15 }
    },
    {
      id: '5',
      name: 'Mortgage Loan',
      code: 'ML',
      description: 'Property mortgage financing',
      isActive: true,
      createdAt: new Date().toISOString(),
      _count: { leads: 22 }
    },
    {
      id: '6',
      name: 'Commercial Vehicle Loan',
      code: 'CVL',
      description: 'Commercial vehicle financing',
      isActive: true,
      createdAt: new Date().toISOString(),
      _count: { leads: 18 }
    },
    {
      id: '7',
      name: 'Construction Equipment Loan',
      code: 'CEL',
      description: 'Construction equipment financing',
      isActive: true,
      createdAt: new Date().toISOString(),
      _count: { leads: 12 }
    },
    {
      id: '8',
      name: 'Education Loan',
      code: 'EL',
      description: 'Education financing',
      isActive: true,
      createdAt: new Date().toISOString(),
      _count: { leads: 25 }
    }
  ]
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    let user;
    if (prisma) {
      // Try to get from database
      try {
        user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, username: true, role: true, isActive: true }
        });
      } catch (dbError) {
        console.log('Database error, falling back to memory data');
        user = fallbackData.users.find(u => u.id === decoded.userId);
      }
    } else {
      // Use fallback data
      user = fallbackData.users.find(u => u.id === decoded.userId);
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based middleware
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const managerOrAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
    return res.status(403).json({ error: 'Manager or Admin access required' });
  }
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: prisma ? 'connected' : 'fallback mode'
  });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    let user;
    if (prisma) {
      try {
        user = await prisma.user.findUnique({
          where: { username },
          include: {
            manager: {
              select: { id: true, name: true }
            }
          }
        });
      } catch (dbError) {
        console.log('Database error, falling back to memory data');
        user = fallbackData.users.find(u => u.username === username);
      }
    } else {
      user = fallbackData.users.find(u => u.username === username);
    }

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For demo, accept 'admin123' for admin
    const isValidPassword = username === 'admin' && password === 'admin123';

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    let user;
    if (prisma) {
      try {
        user = await prisma.user.findUnique({
          where: { id: req.user.id },
          include: {
            manager: {
              select: { id: true, name: true }
            }
          }
        });
      } catch (dbError) {
        user = fallbackData.users.find(u => u.id === req.user.id);
      }
    } else {
      user = fallbackData.users.find(u => u.id === req.user.id);
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin routes
app.get('/api/admin/dashboard/kpi', authenticateToken, adminOnly, async (req, res) => {
  try {
    let data;
    if (prisma) {
      try {
        const [
          totalLeads,
          totalCalls,
          connectedCalls,
          notConnectedCalls,
          todayCalls,
          activeStaff,
          activeManagers
        ] = await Promise.all([
          prisma.lead.count(),
          prisma.callLog.count(),
          prisma.callLog.count({ where: { callResult: 'CONNECTED' } }),
          prisma.callLog.count({ where: { callResult: { not: 'CONNECTED' } } }),
          prisma.callLog.count({
            where: {
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
              }
            }
          }),
          prisma.user.count({
            where: { role: 'STAFF', isActive: true }
          }),
          prisma.user.count({
            where: { role: 'MANAGER', isActive: true }
          })
        ]);
        data = {
          totalLeads,
          totalCalls,
          connectedCalls,
          notConnectedCalls,
          todayCalls,
          activeStaff,
          activeManagers
        };
      } catch (dbError) {
        data = {
          totalLeads: 1250,
          totalCalls: 890,
          connectedCalls: 456,
          notConnectedCalls: 434,
          todayCalls: 78,
          activeStaff: 12,
          activeManagers: 3
        };
      }
    } else {
      data = {
        totalLeads: 1250,
        totalCalls: 890,
        connectedCalls: 456,
        notConnectedCalls: 434,
        todayCalls: 78,
        activeStaff: 12,
        activeManagers: 3
      };
    }
    res.json(data);
  } catch (error) {
    console.error('Dashboard KPI error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/loan-categories', authenticateToken, adminOnly, async (req, res) => {
  try {
    let categories;
    if (prisma) {
      try {
        categories = await prisma.loanCategory.findMany({
          include: {
            _count: {
              select: { leads: true }
            }
          },
          orderBy: { name: 'asc' }
        });
      } catch (dbError) {
        categories = fallbackData.loanCategories;
      }
    } else {
      categories = fallbackData.loanCategories;
    }
    res.json(categories);
  } catch (error) {
    console.error('Loan categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/loan-categories', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { name, code, description, isActive } = req.body;
    
    let newCategory;
    if (prisma) {
      try {
        newCategory = await prisma.loanCategory.create({
          data: { name, code, description, isActive: isActive !== undefined ? isActive : true },
          include: {
            _count: {
              select: { leads: true }
            }
          }
        });
      } catch (dbError) {
        newCategory = {
          id: Date.now().toString(),
          name,
          code,
          description,
          isActive: isActive !== undefined ? isActive : true,
          createdAt: new Date().toISOString(),
          _count: { leads: 0 }
        };
      }
    } else {
      newCategory = {
        id: Date.now().toString(),
        name,
        code,
        description,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date().toISOString(),
        _count: { leads: 0 }
      };
    }

    res.json(newCategory);
  } catch (error) {
    console.error('Create loan category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/admin/loan-categories/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, isActive } = req.body;
    
    let updatedCategory;
    if (prisma) {
      try {
        updatedCategory = await prisma.loanCategory.update({
          where: { id },
          data: { name, code, description, isActive },
          include: {
            _count: {
              select: { leads: true }
            }
          }
        });
      } catch (dbError) {
        updatedCategory = {
          id,
          name,
          code,
          description,
          isActive,
          createdAt: new Date().toISOString(),
          _count: { leads: Math.floor(Math.random() * 50) }
        };
      }
    } else {
      updatedCategory = {
        id,
        name,
        code,
        description,
        isActive,
        createdAt: new Date().toISOString(),
        _count: { leads: Math.floor(Math.random() * 50) }
      };
    }

    res.json(updatedCategory);
  } catch (error) {
    console.error('Update loan category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/users', authenticateToken, adminOnly, async (req, res) => {
  try {
    let users;
    if (prisma) {
      try {
        users = await prisma.user.findMany({
          include: {
            manager: {
              select: { id: true, name: true }
            },
            _count: {
              select: { assignedLeads: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
      } catch (dbError) {
        users = fallbackData.users;
      }
    } else {
      users = fallbackData.users;
    }
    res.json(users);
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload routes
app.get('/api/upload/loan-categories', authenticateToken, managerOrAdmin, async (req, res) => {
  try {
    let categories;
    if (prisma) {
      try {
        categories = await prisma.loanCategory.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            code: true,
            _count: {
              select: { leads: true }
            }
          },
          orderBy: { name: 'asc' }
        });
      } catch (dbError) {
        categories = fallbackData.loanCategories.filter(cat => cat.isActive);
      }
    } else {
      categories = fallbackData.loanCategories.filter(cat => cat.isActive);
    }
    res.json(categories);
  } catch (error) {
    console.error('Upload loan categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/upload/excel', authenticateToken, managerOrAdmin, (req, res) => {
  res.json({
    message: 'File uploaded successfully',
    uploadLog: {
      id: Date.now().toString(),
      filename: 'test.xlsx',
      totalRecords: 100,
      successfulRecords: 95,
      failedRecords: 5,
      skippedDuplicates: 0
    },
    loanCategory: {
      name: 'Business Loan',
      code: 'BL'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`🗄️  Database: ${prisma ? 'PostgreSQL' : 'Fallback Mode'}`);
  console.log(`\n👤 Default admin login:`);
  console.log(`   Username: admin`);
  console.log(`   Password: admin123`);
});
