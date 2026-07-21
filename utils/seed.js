const mongoose = require('mongoose');
const User = require('../models/User');
const Employee = require('../models/Employee');
require('dotenv').config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ email: 'admin@hrportal.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const admin = await User.create({
      email: 'admin@hrportal.com',
      password: 'Admin@123',
      firstName: 'System',
      lastName: 'Admin',
      role: 'admin',
      phone: '+1-555-0100'
    });

    const adminEmployee = await Employee.create({
      user: admin._id,
      employeeId: 'EMP0001',
      department: 'HR',
      position: 'System Administrator',
      joinDate: new Date('2024-01-01'),
      salary: 100000
    });

    const hr = await User.create({
      email: 'hr@hrportal.com',
      password: 'Hr@12345',
      firstName: 'Jane',
      lastName: 'Cooper',
      role: 'hr',
      phone: '+1-555-0101'
    });

    await Employee.create({
      user: hr._id,
      employeeId: 'EMP0002',
      department: 'HR',
      position: 'HR Manager',
      joinDate: new Date('2024-01-15'),
      salary: 85000
    });

    const manager = await User.create({
      email: 'manager@hrportal.com',
      password: 'Manager@123',
      firstName: 'Robert',
      lastName: 'Fox',
      role: 'manager',
      phone: '+1-555-0102'
    });

    await Employee.create({
      user: manager._id,
      employeeId: 'EMP0003',
      department: 'Engineering',
      position: 'Engineering Manager',
      joinDate: new Date('2024-02-01'),
      salary: 95000
    });

    const employee = await User.create({
      email: 'employee@hrportal.com',
      password: 'Employee@123',
      firstName: 'Emily',
      lastName: 'Johnson',
      role: 'employee',
      phone: '+1-555-0103'
    });

    await Employee.create({
      user: employee._id,
      employeeId: 'EMP0004',
      department: 'Engineering',
      position: 'Software Developer',
      joinDate: new Date('2024-03-01'),
      salary: 75000
    });

    console.log('Seed data created successfully!');
    console.log('Admin: admin@hrportal.com / Admin@123');
    console.log('HR: hr@hrportal.com / Hr@12345');
    console.log('Manager: manager@hrportal.com / Manager@123');
    console.log('Employee: employee@hrportal.com / Employee@123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
