const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Performance = require('../models/Performance');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'active' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const presentToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['present', 'late'] }
    });

    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const monthlyPayroll = await Payroll.aggregate([
      { $match: { month: currentMonth, year: currentYear, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$netPay' }, count: { $sum: 1 } } }
    ]);

    const departmentDistribution = await Employee.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentLeaves = await Leave.find({ status: 'pending' })
      .populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName' } })
      .limit(5)
      .sort({ createdAt: -1 });

    const attendanceTrend = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          wfh: { $sum: { $cond: [{ $eq: ['$status', 'work-from-home'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const performanceOverview = await Performance.aggregate([
      {
        $group: {
          _id: '$reviewType',
          avgRating: { $avg: '$overallRating' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalEmployees,
      activeEmployees,
      presentToday,
      absentToday: activeEmployees - presentToday,
      attendanceRate: activeEmployees > 0 ? Math.round((presentToday / activeEmployees) * 100) : 0,
      pendingLeaves,
      monthlyPayroll: monthlyPayroll[0] || { total: 0, count: 0 },
      departmentDistribution,
      recentLeaves,
      attendanceTrend,
      performanceOverview
    });
  } catch (error) {
    next(error);
  }
};

exports.getEmployeeDashboard = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today, $lt: tomorrow }
    });

    const pendingLeaves = await Leave.countDocuments({
      employee: employee._id,
      status: 'pending'
    });

    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const monthlyAttendance = await Attendance.aggregate([
      {
        $match: {
          employee: employee._id,
          date: { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0) }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const latestPayroll = await Payroll.findOne({ employee: employee._id })
      .sort({ year: -1, month: -1 });

    const latestReview = await Performance.findOne({ employee: employee._id })
      .populate('reviewer', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      employee,
      todayAttendance,
      pendingLeaves,
      leaveBalance: employee.leaveBalance,
      monthlyAttendance,
      latestPayroll,
      latestReview
    });
  } catch (error) {
    next(error);
  }
};
