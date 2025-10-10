/**
 * AUTHENTICATION ROUTES - SECURE USER AUTHENTICATION
 * 
 * This module implements secure authentication endpoints following industry standards
 * and security best practices (Stallings & Brown, 2018; OWASP Foundation, 2021).
 * 
 * Security technologies implemented:
 * - Argon2id: Password hashing algorithm (Argon2 Documentation, 2024)
 * - Express Validator: Input validation middleware (Express Validator Documentation, 2024)
 * - JWT: JSON Web Tokens for session management (Auth0, 2024)
 * - Rate Limiting: Brute force protection (Express Rate Limit, 2024)
 * 
 * References:
 * - Stallings, W. & Brown, L. (2018). Computer Security: Principles and Practice (4th ed.). Pearson.
 * - OWASP Foundation. (2021). OWASP Top 10 - 2021: The Ten Most Critical Web Application Security Risks.
 * - Argon2 Documentation. (2024). Argon2 - The password hashing function that won the Password Hashing Competition.
 * - Express Validator Documentation. (2024). express-validator - An express.js middleware for validator.js.
 * - Auth0. (2024). JSON Web Token (JWT) - Introduction to JWT.
 * - Express Rate Limit. (2024). Basic rate-limiting middleware for Express.
 * - Anthropic. (2024). Claude AI Assistant - Authentication routes security implementation guidance.
 */

const express = require('express');
const argon2 = require('argon2');
const { body, validationResult } = require('express-validator');
const { User, Session } = require('../models');
const { generateTokens, logout, verifyToken } = require('../middleware/auth');
const { authLimiter, sanitizeInput, deviceFingerprint, securityLogger } = require('../middleware/security');
const { asyncHandler, ValidationError, AuthenticationError, ConflictError, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Apply security middleware to all auth routes
router.use(sanitizeInput);
router.use(deviceFingerprint);
router.use(securityLogger);

// Input validation rules
const registerValidation = [
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Full name can only contain letters, spaces, apostrophes, and hyphens')
    .customSanitizer(value => value ? value.trim() : value),
  
  body('idNumber')
    .isLength({ min: 5, max: 20 })
    .withMessage('ID number must be between 5 and 20 characters')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('ID number can only contain letters and numbers')
    .custom(async (value) => {
      const user = await User.findOne({ id_number: value.toUpperCase() });
      if (user) {
        throw new Error('ID number already exists');
      }
      return true;
    }),
  
  body('accountNumber')
    .isLength({ min: 8, max: 20 })
    .withMessage('Account number must be between 8 and 20 characters')
    .matches(/^[0-9]+$/)
    .withMessage('Account number can only contain numbers')
    .custom(async (value) => {
      const user = await User.findOne({ account_number: value });
      if (user) {
        throw new Error('Account number already exists');
      }
      return true;
    }),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

const loginValidation = [
  body('idNumber')
    .notEmpty()
    .withMessage('ID number is required')
    .isLength({ min: 5, max: 20 })
    .withMessage('ID number must be between 5 and 20 characters'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty')
];

// Register endpoint
router.post('/register', process.env.NODE_ENV === 'test' ? [] : [authLimiter], registerValidation, asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    throw new ValidationError(`Validation failed: ${errorMessages}`);
  }

  const {
    fullName,
    idNumber,
    accountNumber,
    password
  } = req.body;

  try {
    // Duplicate checks are handled by validation middleware

    // Hash password with Argon2id
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: parseInt(process.env.ARGON2_MEMORY_COST) || 524288, // 2^19
      timeCost: parseInt(process.env.ARGON2_TIME_COST) || 2,
      parallelism: parseInt(process.env.ARGON2_PARALLELISM) || 1
    });

    // Create user
    const user = new User({
      full_name: fullName.trim(),
      id_number: idNumber.toUpperCase().trim(),
      account_number: accountNumber.trim(),
      password_hash: passwordHash
    });
    await user.save();

    // Generate tokens
    const tokens = generateTokens(user);

    // Create session
    const session = new Session({
      user_id: user._id,
      session_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      device_fingerprint: req.deviceFingerprint,
      expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      refresh_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    await session.save();

    // Set session cookie
    req.session.userId = user._id;
    req.session.sessionId = session._id;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: 15 * 60 // 15 minutes in seconds
        }
      }
    });

  } catch (error) {
    // Handle specific database errors
    if (error.code === 11000) {
      if (error.keyValue.id_number) {
        throw new ConflictError('An account with this ID number already exists. Please use a different ID number or try logging in.');
      } else if (error.keyValue.account_number) {
        throw new ConflictError('An account with this account number already exists. Please use a different account number.');
      }
    }
    
    // Re-throw known errors
    if (error instanceof ConflictError || error instanceof ValidationError) {
      throw error;
    }
    
    // Handle unexpected errors
    console.error('Registration error:', error);
    throw new AppError('Registration failed. Please try again.', 500);
  }
}));

// Login endpoint
router.post('/login', process.env.NODE_ENV === 'test' ? [] : [authLimiter], loginValidation, asyncHandler(async (req, res) => {
  // Check validation results
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    throw new ValidationError(`Validation failed: ${errorMessages}`);
  }

  const { idNumber, password } = req.body;

  // Find user by ID number
  const user = await User.findOne({
    id_number: idNumber.toUpperCase()
  });

  if (!user) {
    throw new AuthenticationError('No account found with this ID number. Please check your ID number or register for a new account.');
  }

  // Check if account is locked
  if (user.isLocked()) {
    throw new AuthenticationError('Account is temporarily locked due to multiple failed login attempts');
  }

  // Check if account is active
  if (!user.is_active) {
    throw new AuthenticationError('Account is deactivated');
  }

  // Verify password
  try {
    const isValidPassword = await argon2.verify(user.password_hash, password);
    
    if (!isValidPassword) {
      // Increment failed login attempts
      await user.incrementLoginAttempts();
      throw new AuthenticationError('Invalid ID number or password. Please check your credentials and try again.');
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Check for concurrent sessions and limit them
    const existingSessions = await Session.countDocuments({ 
      user_id: user._id, 
      is_active: true 
    });
    
    if (existingSessions >= 3) { // Limit to 3 concurrent sessions
      // Deactivate oldest sessions
      await Session.updateMany(
        { user_id: user._id, is_active: true },
        { is_active: false },
        { sort: { last_activity: 1 }, limit: existingSessions - 2 }
      );
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).json({ error: 'Session error' });
      }
      
      // Set session data with IP binding
      req.session.userId = user._id;
      req.session.sessionId = tokens.accessToken;
      req.session.ipAddress = req.ip;
      req.session.userAgent = req.get('User-Agent');
      req.session.deviceFingerprint = req.deviceFingerprint;
    });

    // Create session record
    const session = new Session({
      user_id: user._id,
      session_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      device_fingerprint: req.deviceFingerprint,
      expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      refresh_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    await session.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: 15 * 60 // 15 minutes in seconds
        }
      }
    });

  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Invalid credentials');
  }
}));

// Logout endpoint
router.post('/logout', logout, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

// Refresh token endpoint
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  try {
    const decoded = require('jsonwebtoken').verify(refreshToken, process.env.JWT_SECRET, {
      issuer: 'secure-payments-portal',
      audience: 'secure-payments-portal-users'
    });

    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid token type');
    }

    // Find active session for this user
    const session = await Session.findOne({
      user_id: decoded.id,
      is_active: true,
      refresh_expires_at: { $gt: new Date() }
    }).populate('user_id', '-password_hash');

    if (!session) {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = generateTokens(session.user_id);

    // Update session with new tokens
    session.session_token = tokens.accessToken;
    session.refresh_token = tokens.refreshToken;
    session.expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    session.refresh_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await session.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: 15 * 60 // 15 minutes in seconds
        }
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Refresh token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid refresh token');
    }
    throw error;
  }
}));

// Get current user endpoint
router.get('/me', verifyToken, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.toJSON()
    }
  });
}));

// Change password endpoint
router.post('/change-password', process.env.NODE_ENV === 'test' ? [] : [authLimiter], [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New passwords do not match');
      }
      return true;
    })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  if (!req.session || !req.session.userId) {
    throw new AuthenticationError('Not authenticated');
  }

  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.session.userId);

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Verify current password
  const isValidPassword = await argon2.verify(user.password_hash, currentPassword);
  
  if (!isValidPassword) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await argon2.hash(newPassword, {
    type: argon2.argon2id,
    memoryCost: parseInt(process.env.ARGON2_MEMORY_COST) || 524288,
    timeCost: parseInt(process.env.ARGON2_TIME_COST) || 2,
    parallelism: parseInt(process.env.ARGON2_PARALLELISM) || 1
  });

  // Update password
  user.password_hash = newPasswordHash;
  await user.save();

  // Revoke all sessions except current one
  await Session.updateMany(
    {
      user_id: user._id,
      _id: { $ne: req.session.sessionId }
    },
    { is_active: false }
  );

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
}));

module.exports = router;