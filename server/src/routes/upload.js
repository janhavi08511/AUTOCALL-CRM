const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, managerOrAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('sheet') || file.mimetype.includes('excel')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

// Upload Excel file with loan type selection
router.post('/excel', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { loanCategoryId } = req.body;
    
    // Admin-only check
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    if (!loanCategoryId) {
      return res.status(400).json({ error: 'Loan category is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if loan category exists and is active
    const loanCategory = await prisma.loanCategory.findUnique({
      where: { id: loanCategoryId }
    });

    if (!loanCategory || !loanCategory.isActive) {
      return res.status(400).json({ error: 'Invalid or inactive loan category' });
    }

    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    if (data.length > 50000) {
      return res.status(400).json({ error: 'Maximum 50,000 records allowed per file' });
    }

    // Process and validate data
    const processedData = [];
    const duplicateNumbers = new Set();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      const name = row['Name'] || row['name'] || '';
      const phone = row['Phone'] || row['phone'] || '';
      const email = row['Email'] || row['email'] || '';
      const city = row['City'] || row['city'] || '';
      const state = row['State'] || row['state'] || '';

      if (!name || !phone || !city) continue;
      if (duplicateNumbers.has(phone)) continue;
      if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) continue;

      duplicateNumbers.add(phone);

      processedData.push({
        name: name.trim(),
        phone: phone.replace(/\D/g, ''),
        email: email.trim(),
        city: city.trim(),
        state: state.trim(),
        loanCategoryId: loanCategoryId,
        uploadedBy: req.user.id,
        retryCount: 0,
        stage: 'NEW',
        isCompleted: false
      });
    }

    // Check for existing phone numbers in database
    const existingPhones = await prisma.lead.findMany({
      where: {
        phone: { in: processedData.map(d => d.phone) }
      },
      select: { phone: true }
    });

    const existingPhoneSet = new Set(existingPhones.map(p => p.phone));
    const validData = processedData.filter(d => !existingPhoneSet.has(d.phone));

    // Batch insert leads (1000 per batch)
    let insertedCount = 0;
    const batchSize = 1000;
    
    for (let i = 0; i < validData.length; i += batchSize) {
      const batch = validData.slice(i, i + batchSize);
      await prisma.lead.createMany({
        data: batch,
        skipDuplicates: true
      });
      insertedCount += batch.length;
    }

    // Create upload log
    const uploadLog = await prisma.excelUpload.create({
      data: {
        filename: req.file.originalname,
        totalRecords: data.length,
        successfulRecords: insertedCount,
        failedRecords: data.length - insertedCount,
        uploadedBy: req.user.id,
        loanCategoryId: loanCategoryId
      }
    });

    res.json({
      totalRecords: uploadLog.totalRecords,
      insertedRecords: uploadLog.successfulRecords,
      skippedDuplicates: data.length - insertedCount,
      uploadLog: {
        id: uploadLog.id,
        filename: uploadLog.filename,
        totalRecords: uploadLog.totalRecords,
        successfulRecords: uploadLog.successfulRecords,
        failedRecords: uploadLog.failedRecords,
        skippedDuplicates: data.length - insertedCount
      },
      loanCategory: {
        name: loanCategory.name,
        code: loanCategory.code
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// Get upload history
router.get('/history', authenticateToken, managerOrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [uploads, total] = await Promise.all([
      prisma.excelUpload.findMany({
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.excelUpload.count()
    ]);

    // Manually resolve uploader names and loan category names
    const uploaderIds = [...new Set(uploads.map(u => u.uploadedBy))];
    const loanCatIds  = [...new Set(uploads.map(u => u.loanCategoryId))];

    const [uploaders, loanCats] = await Promise.all([
      prisma.user.findMany({ where: { id: { in: uploaderIds } }, select: { id: true, name: true } }),
      prisma.loanCategory.findMany({ where: { id: { in: loanCatIds } }, select: { id: true, name: true, code: true } })
    ]);

    const uploaderMap = Object.fromEntries(uploaders.map(u => [u.id, u]));
    const loanCatMap  = Object.fromEntries(loanCats.map(c => [c.id, c]));

    res.json({
      uploads: uploads.map(u => ({
        ...u,
        uploader:     uploaderMap[u.uploadedBy]     || { id: u.uploadedBy, name: 'Unknown' },
        loanCategory: loanCatMap[u.loanCategoryId]  || { id: u.loanCategoryId, name: 'Unknown', code: 'N/A' }
      })),
      pagination: {
        page: parseInt(page), limit: parseInt(limit), total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Upload history error:', error);
    res.status(500).json({ error: 'Failed to fetch upload history' });
  }
});

// Get loan categories for upload
router.get('/loan-categories', authenticateToken, async (req, res) => {
  try {
    const categories = await prisma.loanCategory.findMany({
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

    res.json(categories);
  } catch (error) {
    console.error('Loan categories error:', error);
    res.status(500).json({ error: 'Failed to fetch loan categories' });
  }
});

// Download sample Excel template
router.get('/template', authenticateToken, managerOrAdmin, (req, res) => {
  try {
    // Create sample data
    const sampleData = [
      {
        'Name': 'John Doe',
        'Phone': '9876543210',
        'Email': 'john.doe@example.com',
        'City': 'Mumbai',
        'State': 'Maharashtra'
      },
      {
        'Name': 'Jane Smith',
        'Phone': '9876543211',
        'Email': 'jane.smith@example.com',
        'City': 'Delhi',
        'State': 'Delhi'
      }
    ];

    // Create workbook
    const ws = xlsx.utils.json_to_sheet(sampleData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Leads Template');

    // Generate buffer
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for download
    res.setHeader('Content-Disposition', 'attachment; filename=leads-template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({ error: 'Failed to download template' });
  }
});

module.exports = router;
