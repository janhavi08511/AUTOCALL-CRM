const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const managerController = require('../controllers/managerController');

const router = express.Router();

// All manager routes require authentication and manager role
router.use(authenticateToken);
router.use(requireRole(['MANAGER']));

// Dashboard
router.get('/dashboard/stats', managerController.getDashboardStats);
router.get('/dashboard/charts', managerController.getChartData);

// Loan Categories
router.get('/loan-categories', managerController.getLoanCategories);

// Excel Upload
router.post('/upload-excel', managerController.uploadExcel);

// Lead Assignment
router.get('/leads/unassigned', managerController.getUnassignedLeads);
router.get('/staff', managerController.getStaffList);
router.post('/leads/assign', managerController.autoAssignLeads);

// Staff Monitoring
router.get('/staff/monitoring', managerController.getStaffMonitoring);

// Qualification Dashboard
router.get('/qualification-dashboard', managerController.getQualificationDashboard);

// Reports
router.get('/reports', managerController.getReports);

module.exports = router;
