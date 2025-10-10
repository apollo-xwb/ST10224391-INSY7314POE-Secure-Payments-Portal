const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { Payment, User } = require('../models');
const currencyService = require('../services/currencyService');


// Get payment statistics
router.get('/stats', verifyToken, asyncHandler(async (req, res) => {
  const userPayments = await Payment.find({
    user_id: req.user._id
  }).select('amount converted_amount status');
  
  // Use converted_amount for accurate ZAR totals, fallback to amount if converted_amount is null
  const totalAmount = userPayments.reduce((sum, payment) => {
    const amount = payment.converted_amount || payment.amount;
    return sum + parseFloat(amount);
  }, 0);
  
  const stats = {
    totalPayments: userPayments.length,
    totalAmount: totalAmount,
    pendingPayments: userPayments.filter(p => p.status === 'pending').length,
    successRate: userPayments.length > 0 ? Math.round((userPayments.filter(p => p.status === 'completed').length / userPayments.length) * 100) : 0,
  };

  res.json({
    success: true,
    data: stats,
  });
}));

// Get recent payments
router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const payments = await Payment.find({
    user_id: req.user._id
  })
  .sort({ createdAt: -1 })
  .limit(parseInt(limit))
  .select('-employee_notes -compliance_checked -aml_verified -kyc_verified');

  res.json({
    success: true,
    data: payments,
  });
}));

// Get payment by ID
router.get('/:id', verifyToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payment = await Payment.findOne({
    _id: id,
    user_id: req.user._id
  }).select('-employee_notes -compliance_checked -aml_verified -kyc_verified');

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found',
    });
  }

  res.json({
    success: true,
    data: payment,
  });
}));

// Create new payment
router.post('/', verifyToken, asyncHandler(async (req, res) => {
  const { 
    payeeName, 
    payeeBank, 
    country, 
    amount, 
    swiftCode, 
    currency, 
    purpose, 
    reference,
    payeeEmail,
    payeeAddress,
    accountNumber,
    payeeAccountNumber
  } = req.body;

  // Log the received data for debugging
  console.log('Payment creation request:', {
    payeeName,
    payeeEmail,
    payeeBank,
    country,
    amount,
    swiftCode,
    currency,
    purpose,
    reference,
    accountNumber
  });

  // Basic validation
  if (!payeeName || !payeeBank || !country || !amount || !swiftCode || !accountNumber) {
    return res.status(400).json({
      success: false,
      message: 'All required fields must be provided',
    });
  }

  // Generate transaction reference
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  const transactionReference = `TXN${timestamp}${random}`;

  try {
    const paymentCurrency = currency || 'ZAR';
    const paymentAmount = parseFloat(amount);
    
    // Calculate exchange rate and converted amount if currency is not ZAR
    let exchangeRate = 1;
    let convertedAmount = paymentAmount;
    
    if (paymentCurrency !== 'ZAR') {
      try {
        exchangeRate = await currencyService.getExchangeRate(paymentCurrency, 'ZAR');
        convertedAmount = paymentAmount * exchangeRate;
        console.log(`Currency conversion: ${paymentAmount} ${paymentCurrency} = ${convertedAmount} ZAR (rate: ${exchangeRate})`);
      } catch (currencyError) {
        console.error('Currency conversion failed:', currencyError);
        // Continue with original amount if conversion fails
        exchangeRate = 1;
        convertedAmount = paymentAmount;
      }
    }

    const newPayment = new Payment({
      user_id: req.user._id,
      transaction_reference: transactionReference,
      amount: paymentAmount,
      currency: paymentCurrency,
      exchange_rate: exchangeRate,
      converted_amount: convertedAmount,
      payee_name: payeeName,
      payee_email: payeeEmail || '',
      payee_bank_name: payeeBank,
      payee_bank_country: country,
      swift_code: swiftCode,
      purpose_of_payment: purpose || '',
      reference: reference || '',
      payee_account_number: accountNumber || payeeAccountNumber || 'TEMP123456',
      payee_bank_address: payeeAddress || '',
      status: 'pending'
    });
    await newPayment.save();

    res.status(201).json({
      success: true,
      data: newPayment,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create payment',
      error: error.message
    });
  }
}));

module.exports = router;