const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const employeeController = require('../controllers/employeeController');

router.use(protect);

router.get('/', employeeController.getAllEmployees);
router.get('/stats', authorize('admin', 'hr'), employeeController.getEmployeeStats);
router.get('/:id', employeeController.getEmployee);

router.post('/', authorize('admin', 'hr'), [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('joinDate').isISO8601().withMessage('Valid join date is required'),
  body('salary').isNumeric().withMessage('Salary must be a number')
], validate, employeeController.createEmployee);

router.put('/:id', authorize('admin', 'hr'), employeeController.updateEmployee);
router.delete('/:id', authorize('admin'), employeeController.deleteEmployee);

module.exports = router;
