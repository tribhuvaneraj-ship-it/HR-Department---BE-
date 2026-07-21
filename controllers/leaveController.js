const Leave = require('../models/Leave');
const Employee = require('../models/Employee');

exports.applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (leaveType !== 'unpaid' && employee.leaveBalance[leaveType] < totalDays) {
      return res.status(400).json({
        error: `Insufficient ${leaveType} leave balance. Available: ${employee.leaveBalance[leaveType]} days`
      });
    }

    const overlapping = await Leave.findOne({
      employee: employee._id,
      status: { $ne: 'cancelled' },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({ error: 'Leave overlaps with existing leave request' });
    }

    const leave = await Leave.create({
      employee: employee._id,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      totalDays
    });

    res.status(201).json(leave);
  } catch (error) {
    next(error);
  }
};

exports.getMyLeaves = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const leaves = await Leave.find({ employee: employee._id })
      .sort({ createdAt: -1 });

    res.json({ leaves, leaveBalance: employee.leaveBalance });
  } catch (error) {
    next(error);
  }
};

exports.getAllLeaves = async (req, res, next) => {
  try {
    const { status, leaveType, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;

    const total = await Leave.countDocuments(query);
    const leaves = await Leave.find(query)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ leaves, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.approveLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id).populate('employee');
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Leave request has already been processed' });
    }

    leave.status = 'approved';
    leave.approvedBy = req.user._id;
    await leave.save();

    const employee = await Employee.findById(leave.employee._id);
    if (employee && leave.leaveType !== 'unpaid') {
      employee.leaveBalance[leave.leaveType] -= leave.totalDays;
      await employee.save();
    }

    res.json(leave);
  } catch (error) {
    next(error);
  }
};

exports.rejectLeave = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Leave request has already been processed' });
    }

    leave.status = 'rejected';
    leave.approvedBy = req.user._id;
    leave.rejectionReason = rejectionReason;
    await leave.save();

    res.json(leave);
  } catch (error) {
    next(error);
  }
};

exports.cancelLeave = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    const leave = await Leave.findOne({ _id: req.params.id, employee: employee._id });

    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot cancel processed leave' });
    }

    leave.status = 'cancelled';
    await leave.save();

    res.json({ message: 'Leave cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getLeaveStats = async (req, res, next) => {
  try {
    const stats = await Leave.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$leaveType', totalDays: { $sum: '$totalDays' }, count: { $sum: 1 } } }
    ]);

    const pending = await Leave.countDocuments({ status: 'pending' });

    res.json({ stats, pendingCount: pending });
  } catch (error) {
    next(error);
  }
};
