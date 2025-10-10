// MongoDB/Mongoose error handling - no need to import specific error types

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.field = field;
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  console.error('Error Details:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || null,
    timestamp: new Date().toISOString()
  });

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = err.errors ? Object.values(err.errors).map(error => error.message).join(', ') : err.message;
    error = new ValidationError(message);
  }

  // Mongoose unique constraint errors (duplicate key)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new ConflictError(message);
  }

  // Mongoose database errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    const message = 'Database operation failed';
    error = new AppError(message, 500);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AuthenticationError(message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AuthenticationError(message);
  }

  // Cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = 'Invalid ID format';
    error = new ValidationError(message);
  }

  // Duplicate key errors (already handled above, but keeping for completeness)
  if (err.code === 11000 && !error.isOperational) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new ConflictError(message);
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    error = new RateLimitError(err.message);
  }

  // Send error response
  sendErrorResponse(error, req, res);
};

// Send error response
const sendErrorResponse = (err, req, res) => {
  // Operational errors: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode,
        ...(err.field && { field: err.field }),
        ...(err.lockedUntil && { lockedUntil: err.lockedUntil }),
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      }
    });
  } else {
    // Programming or unknown errors: don't leak error details
    console.error('Programming Error:', err);
    
    res.status(500).json({
      success: false,
      error: {
        name: 'InternalServerError',
        message: process.env.NODE_ENV === 'production' 
          ? 'Something went wrong' 
          : err.message,
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.originalUrl
      }
    });
  }
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Global error handler for unhandled promise rejections
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Promise Rejection:', err);
    console.error('Promise:', promise);
    
    // Close server gracefully
    process.exit(1);
  });
};

// Global error handler for uncaught exceptions
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  if (Array.isArray(errors)) {
    return errors.map(error => ({
      field: error.path || error.param,
      message: error.msg || error.message,
      value: error.value
    }));
  }
  
  if (errors.errors) {
    return errors.errors.map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));
  }
  
  return [{
    field: 'unknown',
    message: errors.message || 'Validation error',
    value: null
  }];
};

// Security error handler
const securityErrorHandler = (err, req, res, next) => {
  // Log security-related errors
  if (err.statusCode === 401 || err.statusCode === 403 || err.statusCode === 429) {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      type: 'security_error',
      error: err.name,
      message: err.message,
      statusCode: err.statusCode,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id || null
    };
    
    console.warn('Security Event:', securityEvent);
    
    // In production, send to security monitoring service
    // await securityMonitoringService.logEvent(securityEvent);
  }
  
  next(err);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  asyncHandler,
  notFound,
  handleUnhandledRejection,
  handleUncaughtException,
  formatValidationErrors,
  securityErrorHandler
};
