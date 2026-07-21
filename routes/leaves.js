const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const leaveController = require('../controllers/leaveController');

router.use(protect);

router.post('/', [
  body('leaveType').isIn(['annual', 'sick', 'personal', 'unpaid', 'maternity', 'paternity', 'bereavement']).withMessage('Invalid leave type'),
  body('startDate').isISO8601().withMessage('Start date is required'),
  body('endDate').isISO8601().withMessage('End date is required'),
  body('reason').notEmpty().withMessage('Reason is required')
], validate, leaveController.applyLeave);

router.get('/my', leaveController.getMyLeaves);
router.get('/stats', leaveController.getLeaveStats);
router.get('/', authorize('admin', 'hr', 'manager'), leaveController.getAllLeaves);
router.put('/:id/approve', authorize('admin', 'hr', 'manager'), leaveController.approveLeave);
router.put('/:id/reject', authorize('admin', 'hr', 'manager'), leaveController.rejectLeave);
router.put('/:id/cancel', leaveController.cancelLeave);

module.exports = router;
