const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const performanceController = require('../controllers/performanceController');

router.use(protect);

router.post('/', authorize('admin', 'hr', 'manager'), [
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('reviewType').isIn(['quarterly', 'annual', 'mid-year', 'probation', 'project']).withMessage('Invalid review type'),
  body('reviewPeriod.startDate').isISO8601().withMessage('Start date is required'),
  body('reviewPeriod.endDate').isISO8601().withMessage('End date is required')
], validate, performanceController.createReview);

router.get('/my', performanceController.getMyReviews);
router.get('/stats', authorize('admin', 'hr'), performanceController.getPerformanceStats);
router.get('/', authorize('admin', 'hr', 'manager'), performanceController.getAllReviews);
router.get('/:id', performanceController.getReviewById);
router.put('/:id', authorize('admin', 'hr', 'manager'), performanceController.updateReview);
router.put('/:id/finalize', authorize('admin', 'hr'), performanceController.finalizeReview);
router.put('/:id/comments', performanceController.addComments);

module.exports = router;
