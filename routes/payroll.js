const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const payrollController = require('../controllers/payrollController');

router.use(protect);

router.post('/', authorize('admin', 'hr'), [
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
  body('year').isInt({ min: 2020 }).withMessage('Valid year is required')
], validate, payrollController.createPayroll);

router.get('/my', payrollController.getMyPayroll);
router.get('/summary', authorize('admin', 'hr'), payrollController.getPayrollSummary);
router.get('/', authorize('admin', 'hr'), payrollController.getPayrolls);
router.get('/:id', payrollController.getPayrollById);
router.put('/:id/process', authorize('admin', 'hr'), payrollController.processPayroll);
router.put('/:id/pay', authorize('admin', 'hr'), payrollController.markPaid);

module.exports = router;
