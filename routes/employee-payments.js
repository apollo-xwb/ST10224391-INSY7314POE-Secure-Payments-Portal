// Employee payment management routes
const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Payment, User } = require('../models');
const { verifyEmployeeToken } = require('../middleware/employee-auth');
const { sanitizeInput, securityLogger } = require('../middleware/security');
const { asyncHandler, ValidationError, AuthenticationError, AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Apply security middleware
router.use(sanitizeInput);
router.use(securityLogger);

// Apply employee verification to all routes
router.use(verifyEmployeeToken);

// Get all customer payments with filtering and pagination

router.get('/payments',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled']),
    query('currency').optional().isLength({ min: 3, max: 3 }).toUpperCase(),
    query('sortBy').optional().isIn(['createdAt', 'amount', 'status', 'currency']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Invalid query parameters', errors.array());
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.currency) {
      filter.currency = req.query.currency;
    }

    if (req.query.search) {
      filter.$or = [
        { payee_name: { $regex: req.query.search, $options: 'i' } },
        { payee_account_number: { $regex: req.query.search, $options: 'i' } },
        { payment_reference: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Build sort query
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Get payments with user information
    const payments = await Payment.find(filter)
      .populate('user_id', 'full_name email id_number account_number')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Add payment_reference alias for frontend compatibility
    const paymentsWithReference = payments.map(payment => ({
      ...payment,
      payment_reference: payment.transaction_reference
    }));

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        payments: paymentsWithReference,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

// GET /api/employee/payments/stats - Get payment statistics for dashboard

router.get('/payments/stats',
  asyncHandler(async (req, res) => {
    const [
      totalPayments,
      totalAmount,
      pendingCount,
      processingCount,
      completedCount,
      failedCount,
      cancelledCount
    ] = await Promise.all([
      Payment.countDocuments(),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'processing' }),
      Payment.countDocuments({ status: 'completed' }),
      Payment.countDocuments({ status: 'failed' }),
      Payment.countDocuments({ status: 'cancelled' })
    ]);

    const totalCompletedAmount = totalAmount[0]?.total || 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalPayments,
          totalCompletedAmount,
          statusCounts: {
            pending: pendingCount,
            processing: processingCount,
            completed: completedCount,
            failed: failedCount,
            cancelled: cancelledCount
          }
        }
      }
    });
  })
);

// GET /api/employee/payments/:id - Get a specific payment by ID
router.get('/payments/:id',
  asyncHandler(async (req, res) => {
    const payment = await Payment.findById(req.params.id)
      .populate('user_id', 'full_name email id_number account_number')
      .lean();

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    // Add payment_reference alias for frontend compatibility
    const paymentWithReference = {
      ...payment,
      payment_reference: payment.transaction_reference
    };

    res.json({
      success: true,
      data: { payment: paymentWithReference }
    });
  })
);

// PUT /api/employee/payments/:id/status - Update payment status (employees only)
router.put('/payments/:id/status',
  [
    body('status')
      .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled'])
      .withMessage('Invalid status'),
    body('notes')
      .optional({ nullable: true })
      .custom((value) => {
        if (value === undefined || value === null || value === '') return true;
        return typeof value === 'string' && value.trim().length <= 500;
      })
      .withMessage('Notes must be a string with max 500 characters')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    const oldStatus = payment.status;
    const newStatus = req.body.status;

    // SECURITY: Allow all status transitions for employees (for error correction)
    // Employees can update any status to any other status
    // This allows correction of mistakes and handling of edge cases
    const allowedStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    
    if (!allowedStatuses.includes(newStatus)) {
      throw new ValidationError(`Invalid status: ${newStatus}`);
    }

    // Only prevent update if status hasn't changed
    if (oldStatus === newStatus) {
      throw new ValidationError(`Payment is already ${newStatus}`);
    }

    payment.status = newStatus;
    if (req.body.notes) {
      payment.notes = req.body.notes;
    }

    await payment.save();

    // Add payment_reference alias for frontend compatibility
    const paymentWithReference = {
      ...payment.toObject(),
      payment_reference: payment.transaction_reference
    };

    res.json({
      success: true,
      message: `Payment status updated from ${oldStatus} to ${newStatus}`,
      data: { payment: paymentWithReference }
    });
  })
);

// GET /api/employee/customers - Get all customers with payment counts
router.get('/customers',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
  ],
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const customers = await User.find({})
      .select('full_name email id_number account_number createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get payment counts for each customer
    const customerIds = customers.map(c => c._id);
    const paymentCounts = await Payment.aggregate([
      { $match: { user_id: { $in: customerIds } } },
      { $group: { _id: '$user_id', count: { $sum: 1 } } }
    ]);

    const paymentCountMap = {};
    paymentCounts.forEach(pc => {
      paymentCountMap[pc._id.toString()] = pc.count;
    });

    const customersWithCounts = customers.map(customer => ({
      ...customer,
      paymentCount: paymentCountMap[customer._id.toString()] || 0
    }));

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: {
        customers: customersWithCounts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

module.exports = router;

