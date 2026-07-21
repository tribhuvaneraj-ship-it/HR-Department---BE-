const Employee = require('../models/Employee');
const User = require('../models/User');

exports.getAllEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, department, status, search } = req.query;

    const query = {};
    if (department) query.department = department;
    if (status) query.status = status;

    let employeeQuery = Employee.find(query).populate('user', 'firstName lastName email avatar role').populate('manager', 'employeeId');

    if (search) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      query.user = { $in: users.map(u => u._id) };
      employeeQuery = Employee.find(query).populate('user', 'firstName lastName email avatar role').populate('manager', 'employeeId');
    }

    const total = await Employee.countDocuments(query);
    const employees = await employeeQuery
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      employees,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

exports.getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('user', 'firstName lastName email avatar role phone')
      .populate('manager', 'employeeId user');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    next(error);
  }
};

exports.createEmployee = async (req, res, next) => {
  try {
    const {
      email, password, firstName, lastName, phone,
      department, position, joinDate, employmentType, salary,
      address, emergencyContact, manager
    } = req.body;

    const user = await User.create({
      email, password, firstName, lastName, phone, role: 'employee'
    });

    const employeeCount = await Employee.countDocuments();
    const employeeId = `EMP${String(employeeCount + 1).padStart(4, '0')}`;

    const employee = await Employee.create({
      user: user._id,
      employeeId,
      department,
      position,
      joinDate,
      employmentType,
      salary,
      address,
      emergencyContact,
      manager: manager || undefined
    });

    res.status(201).json(employee);
  } catch (error) {
    next(error);
  }
};

exports.updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email avatar role');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    next(error);
  }
};

exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await User.findByIdAndDelete(employee.user);
    await Employee.findByIdAndDelete(req.params.id);

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getEmployeeStats = async (req, res, next) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'active' });
    const departmentStats = await Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const typeStats = await Employee.aggregate([
      { $group: { _id: '$employmentType', count: { $sum: 1 } } }
    ]);

    res.json({
      total: totalEmployees,
      active: activeEmployees,
      onLeave: totalEmployees - activeEmployees,
      departments: departmentStats,
      employmentTypes: typeStats
    });
  } catch (error) {
    next(error);
  }
};
