const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple in-memory user storage (temporary)
const users = [
  {
    id: 'admin-1',
    username: 'admin',
    password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQj', // 'admin123'
    name: 'System Administrator',
    role: 'ADMIN',
    isActive: true
  }
];

// JWT Secret
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.userId);
    
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = users.find(u => u.username === username);

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

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  res.json(userWithoutPassword);
});

// Admin routes
app.get('/api/admin/dashboard/kpi', authenticateToken, adminOnly, (req, res) => {
  res.json({
    totalLeads: 1250,
    totalCalls: 890,
    connectedCalls: 456,
    notConnectedCalls: 434,
    todayCalls: 78,
    activeStaff: 12,
    activeManagers: 3
  });
});

app.get('/api/admin/loan-categories', authenticateToken, adminOnly, (req, res) => {
  res.json([
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
    }
  ]);
});

app.get('/api/admin/users', authenticateToken, adminOnly, (req, res) => {
  res.json([
    {
      id: '1',
      username: 'admin',
      email: 'admin@crm.com',
      name: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
      managerId: null,
      createdAt: new Date().toISOString()
    }
  ]);
});

app.post('/api/admin/loan-categories', authenticateToken, adminOnly, (req, res) => {
  const { name, code, description, isActive } = req.body;
  
  const newCategory = {
    id: Date.now().toString(),
    name,
    code,
    description,
    isActive: isActive !== undefined ? isActive : true,
    createdAt: new Date().toISOString(),
    _count: { leads: 0 }
  };

  res.json(newCategory);
});

app.put('/api/admin/loan-categories/:id', authenticateToken, adminOnly, (req, res) => {
  const { id } = req.params;
  const { name, code, description, isActive } = req.body;
  
  const updatedCategory = {
    id,
    name,
    code,
    description,
    isActive,
    createdAt: new Date().toISOString(),
    _count: { leads: Math.floor(Math.random() * 50) }
  };

  res.json(updatedCategory);
});

// Upload routes
app.get('/api/upload/loan-categories', authenticateToken, (req, res) => {
  res.json([
    { id: '1', name: 'Business Loan', code: 'BL', _count: { leads: 45 } },
    { id: '2', name: 'Personal Loan', code: 'PL', _count: { leads: 32 } },
    { id: '3', name: 'Home Loan', code: 'HL', _count: { leads: 28 } }
  ]);
});

app.post('/api/upload/excel', authenticateToken, (req, res) => {
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

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📊 Admin API: http://localhost:${PORT}/api/admin`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`\n👤 Default admin login:`);
  console.log(`   Username: admin`);
  console.log(`   Password: admin123`);
});
