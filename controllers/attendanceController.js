const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

exports.clockIn = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 86400000) }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already clocked in today' });
    }

    const clockInTime = new Date();
    const workStart = new Date(today);
    workStart.setHours(9, 0, 0, 0);

    const status = clockInTime > workStart ? 'late' : 'present';

    const attendance = await Attendance.create({
      employee: employee._id,
      date: today,
      clockIn: clockInTime,
      status
    });

    res.status(201).json({ attendance, message: 'Clocked in successfully' });
  } catch (error) {
    next(error);
  }
};

exports.clockOut = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 86400000) }
    });

    if (!attendance) {
      return res.status(400).json({ error: 'No clock-in record found for today' });
    }

    if (attendance.clockOut) {
      return res.status(400).json({ error: 'Already clocked out today' });
    }

    attendance.clockOut = new Date();

    const workEnd = new Date(today);
    workEnd.setHours(18, 0, 0, 0);

    if (attendance.clockOut > workEnd) {
      const overtimeMs = attendance.clockOut - workEnd;
      attendance.overtime = Math.round(overtimeMs / (1000 * 60 * 60) * 100) / 100;
    }

    await attendance.save();

    res.json({ attendance, message: 'Clocked out successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getTodayAttendance = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 86400000) }
    });

    res.json(attendance || null);
  } catch (error) {
    next(error);
  }
};

exports.getMonthlyAttendance = async (req, res, next) => {
  try {
    const { month, year, employeeId } = req.query;

    let employee;
    if (employeeId) {
      employee = await Employee.findById(employeeId);
    } else {
      employee = await Employee.findOne({ user: req.user._id });
    }

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const attendance = await Attendance.find({
      employee: employee._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    const summary = {
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      halfDay: attendance.filter(a => a.status === 'half-day').length,
      workFromHome: attendance.filter(a => a.status === 'work-from-home').length,
      totalOvertime: attendance.reduce((sum, a) => sum + (a.overtime || 0), 0)
    };

    res.json({ attendance, summary });
  } catch (error) {
    next(error);
  }
};

exports.getAllAttendance = async (req, res, next) => {
  try {
    const { date, department, status } = req.query;
    const query = {};

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      query.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }

    const attendance = await Attendance.find(query)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName' }
      })
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    next(error);
  }
};

exports.updateAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { ...req.body, approvedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json(attendance);
  } catch (error) {
    next(error);
  }
};
