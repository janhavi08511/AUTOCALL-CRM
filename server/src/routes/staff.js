const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const staffController = require('../controllers/staffController');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['STAFF']));

router.get('/dashboard/stats', staffController.getDashboardStats);
router.get('/leads', staffController.getAssignedLeads);
router.get('/leads/:id/phone', staffController.getLeadPhone);
router.post('/call-status', staffController.updateCallStatus);
router.post('/pending-details', staffController.savePendingDetails);
router.get('/call-history', staffController.getCallHistory);

module.exports = router;
