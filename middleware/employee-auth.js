// Employee authentication middleware
const jwt = require('jsonwebtoken');
const { Employee } = require('../models');

// SECURITY: Employee token verification middleware
const verifyEmployeeToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'secure-payments-portal',
      audience: 'secure-payments-portal-employees'
    });

    if (decoded.role !== 'employee') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token type'
      });
    }

    const employee = await Employee.findById(decoded.id);
    if (!employee || !employee.is_active) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Employee not found or inactive'
      });
    }

    req.user = decoded;
    req.employee = employee;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again'
      });
    }
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
};

module.exports = {
  verifyEmployeeToken
};

