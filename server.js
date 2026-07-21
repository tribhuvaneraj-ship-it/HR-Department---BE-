const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const User = require('./models/User');
const Employee = require('./models/Employee');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const payrollRoutes = require('./routes/payroll');
const performanceRoutes = require('./routes/performance');
const documentRoutes = require('./routes/documents');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:5173',
      'http://localhost:3000'
    ].filter(Boolean);
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

async function seedDatabase() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('No users found — seeding database...');
    const admin = await User.create({ email: 'admin@hrportal.com', password: 'Admin@123', firstName: 'System', lastName: 'Admin', role: 'admin', phone: '+1-555-0100' });
    await Employee.create({ user: admin._id, employeeId: 'EMP0001', department: 'HR', position: 'System Administrator', joinDate: new Date('2024-01-01'), salary: 100000 });

    const hr = await User.create({ email: 'hr@hrportal.com', password: 'Hr@12345', firstName: 'Jane', lastName: 'Cooper', role: 'hr', phone: '+1-555-0101' });
    await Employee.create({ user: hr._id, employeeId: 'EMP0002', department: 'HR', position: 'HR Manager', joinDate: new Date('2024-01-15'), salary: 85000 });

    const manager = await User.create({ email: 'manager@hrportal.com', password: 'Manager@123', firstName: 'Robert', lastName: 'Fox', role: 'manager', phone: '+1-555-0102' });
    await Employee.create({ user: manager._id, employeeId: 'EMP0003', department: 'Engineering', position: 'Engineering Manager', joinDate: new Date('2024-02-01'), salary: 95000 });

    const employee = await User.create({ email: 'employee@hrportal.com', password: 'Employee@123', firstName: 'Emily', lastName: 'Johnson', role: 'employee', phone: '+1-555-0103' });
    await Employee.create({ user: employee._id, employeeId: 'EMP0004', department: 'Engineering', position: 'Software Developer', joinDate: new Date('2024-03-01'), salary: 75000 });

    console.log('Seed complete!');
    console.log('Admin: admin@hrportal.com / Admin@123');
    console.log('HR: hr@hrportal.com / Hr@12345');
    console.log('Manager: manager@hrportal.com / Manager@123');
    console.log('Employee: employee@hrportal.com / Employee@123');
  }
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  await seedDatabase();
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
}

startServer();
