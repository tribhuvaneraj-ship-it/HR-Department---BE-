const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Legal', 'Design', 'Product', 'Support']
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  joinDate: {
    type: Date,
    required: [true, 'Join date is required']
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'intern'],
    default: 'full-time'
  },
  status: {
    type: String,
    enum: ['active', 'on-leave', 'terminated', 'suspended'],
    default: 'active'
  },
  salary: {
    type: Number,
    required: [true, 'Salary is required'],
    min: 0
  },
  bankAccount: {
    accountNumber: String,
    bankName: String,
    routingNumber: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  skills: [String],
  certifications: [{
    name: String,
    issuedDate: Date,
    expiryDate: Date,
    issuingBody: String
  }],
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  leaveBalance: {
    annual: { type: Number, default: 20 },
    sick: { type: Number, default: 10 },
    personal: { type: Number, default: 5 },
    unpaid: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
