const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.use(protect);

router.get('/', authorize('admin', 'hr'), dashboardController.getDashboardStats);
router.get('/employee', dashboardController.getEmployeeDashboard);

module.exports = router;
