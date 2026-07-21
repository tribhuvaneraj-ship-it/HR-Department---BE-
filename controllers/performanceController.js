const Performance = require('../models/Performance');
const Employee = require('../models/Employee');

exports.createReview = async (req, res, next) => {
  try {
    const { employeeId, reviewPeriod, reviewType, ratings, strengths, improvements, goals, comments } = req.body;

    const overallRating = ratings ? Object.values(ratings).reduce((sum, val) => sum + val, 0) / Object.keys(ratings).length : 0;

    const review = await Performance.create({
      employee: employeeId,
      reviewer: req.user._id,
      reviewPeriod,
      reviewType,
      ratings,
      overallRating: Math.round(overallRating * 100) / 100,
      strengths,
      improvements,
      goals,
      comments
    });

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

exports.getMyReviews = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const reviews = await Performance.find({ employee: employee._id })
      .populate('reviewer', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

exports.getAllReviews = async (req, res, next) => {
  try {
    const { reviewType, page = 1, limit = 10 } = req.query;

    const query = {};
    if (reviewType) query.reviewType = reviewType;

    const total = await Performance.countDocuments(query);
    const reviews = await Performance.find(query)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate('reviewer', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ reviews, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.getReviewById = async (req, res, next) => {
  try {
    const review = await Performance.findById(req.params.id)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email avatar' }
      })
      .populate('reviewer', 'firstName lastName');

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    next(error);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const review = await Performance.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.status === 'final') {
      return res.status(400).json({ error: 'Cannot edit finalized review' });
    }

    Object.assign(review, req.body);

    if (req.body.ratings) {
      const values = Object.values(req.body.ratings);
      review.overallRating = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
    }

    await review.save();
    res.json(review);
  } catch (error) {
    next(error);
  }
};

exports.finalizeReview = async (req, res, next) => {
  try {
    const review = await Performance.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    review.status = 'final';
    await review.save();

    res.json(review);
  } catch (error) {
    next(error);
  }
};

exports.addComments = async (req, res, next) => {
  try {
    const { comments } = req.body;
    const review = await Performance.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (!review.comments) review.comments = {};

    if (req.user.role === 'admin' || req.user.role === 'hr') {
      review.comments.hr = comments.hr || review.comments.hr;
    }
    if (req.user.role === 'manager' || req.user.role === 'admin') {
      review.comments.manager = comments.manager || review.comments.manager;
    }

    await review.save();
    res.json(review);
  } catch (error) {
    next(error);
  }
};

exports.getPerformanceStats = async (req, res, next) => {
  try {
    const stats = await Performance.aggregate([
      {
        $group: {
          _id: '$reviewType',
          avgRating: { $avg: '$overallRating' },
          count: { $sum: 1 },
          maxRating: { $max: '$overallRating' },
          minRating: { $min: '$overallRating' }
        }
      }
    ]);

    const recentReviews = await Performance.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({ stats, recentReviews });
  } catch (error) {
    next(error);
  }
};
