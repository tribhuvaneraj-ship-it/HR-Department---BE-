const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

exports.createPayroll = async (req, res, next) => {
  try {
    const { employeeId, month, year, allowances, deductions, overtime, bonus } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const existing = await Payroll.findOne({ employee: employeeId, month, year });
    if (existing) {
      return res.status(400).json({ error: 'Payroll already exists for this employee in this period' });
    }

    const totalAllowances = Object.values(allowances || {}).reduce((sum, val) => sum + (val || 0), 0);
    const totalDeductions = Object.values(deductions || {}).reduce((sum, val) => sum + (val || 0), 0);
    const overtimeAmount = (overtime?.hours || 0) * (overtime?.rate || 0);

    const grossPay = employee.salary + totalAllowances + overtimeAmount + (bonus || 0);
    const netPay = grossPay - totalDeductions;

    const payroll = await Payroll.create({
      employee: employeeId,
      month,
      year,
      basicSalary: employee.salary,
      allowances,
      deductions,
      overtime: { ...overtime, amount: overtimeAmount },
      bonus: bonus || 0,
      netPay,
      processedBy: req.user._id
    });

    res.status(201).json(payroll);
  } catch (error) {
    next(error);
  }
};

exports.getPayrolls = async (req, res, next) => {
  try {
    const { month, year, status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;

    const total = await Payroll.countDocuments(query);
    const payrolls = await Payroll.find(query)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate('processedBy', 'firstName lastName')
      .sort({ year: -1, month: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ payrolls, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.getMyPayroll = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }

    const payrolls = await Payroll.find({ employee: employee._id })
      .sort({ year: -1, month: -1 });

    res.json(payrolls);
  } catch (error) {
    next(error);
  }
};

exports.getPayrollById = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate({
        path: 'employee',
        populate: { path: 'user', select: 'firstName lastName email phone' }
      })
      .populate('processedBy', 'firstName lastName');

    if (!payroll) {
      return res.status(404).json({ error: 'Payroll not found' });
    }

    res.json(payroll);
  } catch (error) {
    next(error);
  }
};

exports.processPayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll not found' });
    }

    if (payroll.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft payrolls can be processed' });
    }

    payroll.status = 'processed';
    await payroll.save();

    res.json(payroll);
  } catch (error) {
    next(error);
  }
};

exports.markPaid = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ error: 'Payroll not found' });
    }

    if (payroll.status !== 'processed') {
      return res.status(400).json({ error: 'Only processed payrolls can be marked as paid' });
    }

    payroll.status = 'paid';
    payroll.paidDate = new Date();
    await payroll.save();

    res.json(payroll);
  } catch (error) {
    next(error);
  }
};

exports.getPayrollSummary = async (req, res, next) => {
  try {
    const { year } = req.query;
    const y = parseInt(year) || new Date().getFullYear();

    const summary = await Payroll.aggregate([
      { $match: { year: y, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$month',
          totalPay: { $sum: '$netPay' },
          totalDeductions: {
            $sum: {
              $add: [
                { $ifNull: ['$deductions.tax', 0] },
                { $ifNull: ['$deductions.insurance', 0] },
                { $ifNull: ['$deductions.pension', 0] }
              ]
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalExpense = summary.reduce((sum, s) => sum + s.totalPay, 0);

    res.json({ summary, totalExpense, year: y });
  } catch (error) {
    next(error);
  }
};
