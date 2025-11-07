// Customer payment notifications routes
const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { Payment } = require('../models');

const router = express.Router();

// Get notifications for the authenticated user
router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const { limit = 10, unreadOnly = false } = req.query;
  
  // Get recent payments for the user
  const payments = await Payment.find({
    user_id: req.user._id
  })
  .sort({ updatedAt: -1 })
  .limit(parseInt(limit))
  .select('transaction_reference status amount currency createdAt updatedAt');

  // Generate notifications from payment status changes
  const notifications = payments.map(payment => {
    const isUpdated = payment.updatedAt.getTime() !== payment.createdAt.getTime();
    const statusMessages = {
      pending: 'Your payment is pending review',
      processing: 'Your payment is being processed',
      completed: 'Your payment has been completed successfully',
      failed: 'Your payment failed to process',
      cancelled: 'Your payment has been cancelled'
    };

    return {
      id: payment._id.toString(),
      type: 'payment_status',
      title: `Payment ${payment.transaction_reference}`,
      message: statusMessages[payment.status] || 'Payment status updated',
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      payment_reference: payment.transaction_reference, // Add payment_reference alias
      read: false, // Simple implementation - can be enhanced with Notification model
      createdAt: payment.updatedAt, // Use updatedAt for status change notifications
      paymentId: payment._id.toString()
    };
  });

  // Filter unread if requested
  const filteredNotifications = unreadOnly === 'true' 
    ? notifications.filter(n => !n.read)
    : notifications;

  // Sort by date (most recent first)
  filteredNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    data: {
      notifications: filteredNotifications,
      unreadCount: notifications.filter(n => !n.read).length
    }
  });
}));

// Mark a notification as read
router.put('/:id/read', verifyToken, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Notification marked as read'
  });
}));

// Mark all notifications as read
router.put('/read-all', verifyToken, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
}));

module.exports = router;

