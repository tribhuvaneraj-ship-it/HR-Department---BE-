const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewPeriod: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  reviewType: {
    type: String,
    enum: ['quarterly', 'annual', 'mid-year', 'probation', 'project'],
    required: true
  },
  ratings: {
    productivity: { type: Number, min: 1, max: 5 },
    quality: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    teamwork: { type: Number, min: 1, max: 5 },
    initiative: { type: Number, min: 1, max: 5 },
    leadership: { type: Number, min: 1, max: 5 }
  },
  overallRating: {
    type: Number,
    min: 1,
    max: 5
  },
  strengths: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  improvements: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  goals: [{
    title: String,
    description: String,
    targetDate: Date,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending'
    }
  }],
  comments: {
    employee: String,
    manager: String,
    hr: String
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'final'],
    default: 'draft'
  }
}, {
  timestamps: true
});

performanceSchema.index({ employee: 1, reviewType: 1 });
performanceSchema.index({ reviewPeriod: -1 });

module.exports = mongoose.model('Performance', performanceSchema);
