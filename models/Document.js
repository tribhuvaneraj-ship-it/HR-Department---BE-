const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['contract', 'id-proof', 'address-proof', 'certificate', 'policy', 'offer-letter', 'experience-letter', 'relieving-letter', 'other'],
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  isConfidential: {
    type: Boolean,
    default: false
  },
  tags: [String],
  expiryDate: Date,
  status: {
    type: String,
    enum: ['active', 'archived', 'expired'],
    default: 'active'
  }
}, {
  timestamps: true
});

documentSchema.index({ employee: 1, category: 1 });
documentSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Document', documentSchema);
