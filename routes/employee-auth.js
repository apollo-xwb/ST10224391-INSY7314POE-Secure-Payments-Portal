// Employee authentication routes - no registration process allowed
const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { Employee, Session } = require('../models');
const { logout } = require('../middleware/auth');
const { verifyEmployeeToken } = require('../middleware/employee-auth');
const { authLimiter, sanitizeInput, deviceFingerprint, securityLogger } = require('../middleware/security');
const { asyncHandler, ValidationError, AuthenticationError, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// SECURITY: Employee-specific token generation
const generateEmployeeTokens = (employee) => {
  const payload = {
    id: employee._id.toString(),
    email: employee.email,
    role: 'employee',
    employee_id: employee.employee_id
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: 'secure-payments-portal',
    audience: 'secure-payments-portal-employees'
  });

  const refreshToken = jwt.sign(
    { id: employee._id.toString(), type: 'refresh', role: 'employee' },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'secure-payments-portal',
      audience: 'secure-payments-portal-employees'
    }
  );

  return { accessToken, refreshToken };
};

// Apply security middleware to all employee auth routes
router.use(sanitizeInput);
router.use(deviceFingerprint);
router.use(securityLogger);

// SECURITY: Input validation rules for employee login
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email address is required')
    .normalizeEmail()
    .customSanitizer(value => value ? value.toLowerCase().trim() : value),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
];

// Employee login endpoint (no registration allowed)
router.post('/login', 
  authLimiter,
  loginValidation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }

    const { email, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'Unknown';
    const deviceFingerprint = req.deviceFingerprint;

    // SECURITY: Find employee with password hash included
    const employee = await Employee.findOne({ email }).select('+password_hash');
    
    if (!employee) {
      throw new AuthenticationError('Invalid email or password');
    }

    // SECURITY: Check if account is locked
    if (employee.isLocked()) {
      const lockTime = Math.ceil((employee.locked_until - new Date()) / 60000);
      throw new AuthenticationError(`Account is locked. Please try again in ${lockTime} minute(s).`);
    }

    // SECURITY: Check if account is active
    if (!employee.is_active) {
      throw new AuthenticationError('Account is deactivated. Please contact administrator.');
    }

    // SECURITY: Verify password using Argon2id
    const isPasswordValid = await employee.verifyPassword(password);

    if (!isPasswordValid) {
      // SECURITY: Increment failed login attempts
      await employee.incrementFailedLoginAttempts();
      throw new AuthenticationError('Invalid email or password');
    }

    // SECURITY: Reset failed login attempts on successful login
    await employee.resetFailedLoginAttempts();

    // SECURITY: Update last login information
    employee.last_login = new Date();
    employee.last_login_ip = clientIp;
    await employee.save();

    // SECURITY: Generate JWT tokens
    const { accessToken, refreshToken } = generateEmployeeTokens(employee);

    // SECURITY: Create session record
    const session = new Session({
      user_id: employee._id,
      session_token: accessToken,
      refresh_token: refreshToken,
      ip_address: clientIp,
      user_agent: userAgent,
      device_fingerprint: deviceFingerprint,
      is_active: true,
      expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      refresh_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      login_method: 'password',
      risk_score: 0
    });

    await session.save();

    // SECURITY: Set secure HTTP-only cookie for refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Employee login successful',
      data: {
        accessToken,
        employee: {
          id: employee._id,
          employee_id: employee.employee_id,
          full_name: employee.full_name,
          email: employee.email,
          role: employee.role,
          department: employee.department
        }
      }
    });
  })
);

// POST /api/employee/auth/logout - Employee logout endpoint
router.post('/logout',
  verifyEmployeeToken,
  asyncHandler(async (req, res) => {
    // Deactivate all sessions for this employee
    await Session.updateMany(
      { user_id: req.user.id },
      { is_active: false }
    );
    
    res.clearCookie('refreshToken');
    res.json({
      success: true,
      message: 'Employee logout successful'
    });
  })
);

// GET /api/employee/auth/me - Get current employee profile
router.get('/me',
  verifyEmployeeToken,
  asyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.user.id);
    
    if (!employee) {
      throw new AuthenticationError('Employee not found');
    }

    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          employee_id: employee.employee_id,
          full_name: employee.full_name,
          email: employee.email,
          role: employee.role,
          department: employee.department,
          last_login: employee.last_login,
          createdAt: employee.createdAt
        }
      }
    });
  })
);

module.exports = router;
module.exports.generateEmployeeTokens = generateEmployeeTokens;

