const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

router.use(protect);

router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.get('/today', attendanceController.getTodayAttendance);
router.get('/monthly', attendanceController.getMonthlyAttendance);
router.get('/', authorize('admin', 'hr', 'manager'), attendanceController.getAllAttendance);
router.put('/:id', authorize('admin', 'hr'), attendanceController.updateAttendance);

module.exports = router;
