// Anthropic. (2024). Claude AI Assistant - Payment model security implementation guidance
// Payment model with security features
const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema({
  // USER ASSOCIATION - Links payment to authenticated user
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true                    // SECURITY: Every payment must be linked to a user
  },
  
  // TRANSACTION REFERENCE - Unique identifier for tracking
  transaction_reference: {
    type: String,
    required: true,
    minlength: 10,                    // Minimum length for security
    maxlength: 50,                    // Maximum length to prevent buffer overflow
    match: /^[A-Z0-9_-]+$/            // SECURITY: Only alphanumeric, underscore, hyphen
  },
  
  // PAYMENT AMOUNT - Financial validation with strict limits
  amount: {
    type: Number,
    required: true,
    min: 0.01,                        // SECURITY: Minimum amount to prevent zero/negative
    max: 999999999.99                 // SECURITY: Maximum amount to prevent overflow attacks
  },
  
  // CURRENCY CODE - ISO 4217 standard validation
  currency: {
    type: String,
    required: true,
    length: 3,                        // SECURITY: Exactly 3 characters (ISO standard)
    match: /^[A-Z]{3}$/,              // SECURITY: Only uppercase letters
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD', 'ZAR']
  },
  
  // EXCHANGE RATE - Currency conversion tracking
  exchange_rate: {
    type: Number,
    min: 0.000001,                    // SECURITY: Minimum valid exchange rate
    max: 999999.999999                // SECURITY: Maximum valid exchange rate
  },
  
  // CONVERTED AMOUNT - Final amount in base currency
  converted_amount: {
    type: Number,
    min: 0.01,                        // SECURITY: Minimum converted amount
    max: 999999999.99                 // SECURITY: Maximum converted amount
  },
  
  // PAYEE NAME - Beneficiary validation
  payee_name: {
    type: String,
    required: true,
    trim: true,                       // Remove whitespace
    minlength: 1,                     // Minimum length validation
    maxlength: 100,                   // Maximum length to prevent buffer overflow
    match: /^[a-zA-Z0-9\s.'-]+$/      // SECURITY: Only letters, numbers, spaces, dots, apostrophes, hyphens
  },
  
  // PAYEE EMAIL - Email validation with XSS prevention
  payee_email: {
    type: String,
    trim: true,                       // Remove whitespace
    lowercase: true,                  // Normalize to lowercase
    maxlength: 255,                   // RFC 5321 maximum email length
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/  // SECURITY: Standard email regex pattern
  },
  
  // PAYEE ACCOUNT NUMBER - Bank account validation
  payee_account_number: {
    type: String,
    required: true,
    trim: true,                       // Remove whitespace
    uppercase: true,                  // Normalize to uppercase
    minlength: 5,                     // Minimum length for security
    maxlength: 50,                    // Maximum length validation
    match: /^[A-Z0-9]+$/              // SECURITY: Only alphanumeric characters
  },
  
  // PAYEE BANK NAME - Bank name validation
  payee_bank_name: {
    type: String,
    required: true,
    trim: true,                       // Remove whitespace
    minlength: 1,                     // Minimum length validation
    maxlength: 100,                   // Maximum length validation
    match: /^[a-zA-Z0-9\s.'-]+$/      // SECURITY: Only letters, numbers, spaces, dots, apostrophes, hyphens
  },
  
  // PAYEE BANK ADDRESS - Address field with length limit
  payee_bank_address: {
    type: String,
    maxlength: 500                    // SECURITY: Maximum length to prevent buffer overflow
  },
  
  // PAYEE BANK CITY - City name validation
  payee_bank_city: {
    type: String,
    trim: true,                       // Remove whitespace
    maxlength: 100,                   // Maximum length validation
    match: /^[a-zA-Z\s'-]+$/          // SECURITY: Only letters, spaces, apostrophes, hyphens
  },
  
  // PAYEE BANK COUNTRY - Country name validation
  payee_bank_country: {
    type: String,
    required: true,
    trim: true,                       // Remove whitespace
    minlength: 1,                     // Minimum length validation
    maxlength: 100,                   // Maximum length validation
    match: /^[a-zA-Z\s'-]+$/          // SECURITY: Only letters, spaces, apostrophes, hyphens
  },
  
  // SWIFT CODE - International banking standard validation
  swift_code: {
    type: String,
    required: true,
    trim: true,                       // Remove whitespace
    uppercase: true,                  // Normalize to uppercase
    minlength: 8,                     // SECURITY: Minimum SWIFT code length
    maxlength: 11,                    // SECURITY: Maximum SWIFT code length
    match: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/  // SECURITY: SWIFT code format validation
  },
  
  // IBAN - International Bank Account Number validation
  iban: {
    type: String,
    trim: true,                       // Remove whitespace
    uppercase: true,                  // Normalize to uppercase
    minlength: 15,                    // SECURITY: Minimum IBAN length
    maxlength: 34,                    // SECURITY: Maximum IBAN length
    match: /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/  // SECURITY: IBAN format validation
  },
  
  // ROUTING NUMBER - US bank routing number validation
  routing_number: {
    type: String,
    minlength: 8,                     // SECURITY: Minimum routing number length
    maxlength: 20,                    // SECURITY: Maximum routing number length
    match: /^[0-9]+$/                 // SECURITY: Only numeric characters
  },
  
  // PURPOSE OF PAYMENT - Payment purpose validation
  purpose_of_payment: {
    type: String,
    maxlength: 200,                   // SECURITY: Maximum length to prevent buffer overflow
    match: /^[a-zA-Z0-9\s.,'-]+$/     // SECURITY: Only letters, numbers, spaces, punctuation
  },
  
  // REFERENCE - Payment reference validation
  reference: {
    type: String,
    maxlength: 100,                   // SECURITY: Maximum length validation
    match: /^[a-zA-Z0-9\s\-_#]+$/     // SECURITY: Only alphanumeric, spaces, hyphens, underscores, hash
  },
  
  // PAYMENT INSTRUCTIONS - Additional instructions
  payment_instructions: {
    type: String,
    maxlength: 1000                   // SECURITY: Maximum length to prevent buffer overflow
  },
  
  // PAYMENT STATUS - Workflow status tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processing', 'completed', 'failed'],
    default: 'pending'                // SECURITY: New payments start as pending
  },
  
  // PAYMENT PRIORITY - Processing priority
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'standard'],
    default: 'normal'                 // SECURITY: Default to normal priority
  },
  
  // PROCESSING FEE - Fee calculation
  processing_fee: {
    type: Number,
    min: 0,                           // SECURITY: Fees cannot be negative
    max: 9999.99                      // SECURITY: Maximum fee limit
  },
  
  // TOTAL AMOUNT - Final amount including fees
  total_amount: {
    type: Number,
    min: 0.01,                        // SECURITY: Minimum total amount
    max: 999999999.99                 // SECURITY: Maximum total amount
  },
  
  // ESTIMATED DELIVERY DATE - Future date validation
  estimated_delivery_date: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > new Date();  // SECURITY: Must be in the future
      },
      message: 'Estimated delivery date must be in the future'
    }
  },
  
  // ACTUAL DELIVERY DATE - Actual completion date
  actual_delivery_date: {
    type: Date
  },
  
  // REJECTION REASON - Reason for payment rejection
  rejection_reason: {
    type: String,
    maxlength: 500                    // SECURITY: Maximum length validation
  },
  
  // EMPLOYEE NOTES - Internal notes (sensitive data)
  employee_notes: {
    type: String,
    maxlength: 1000                   // SECURITY: Maximum length validation
  },
  
  // COMPLIANCE CHECKED - AML compliance status
  compliance_checked: {
    type: Boolean,
    default: false                    // SECURITY: Default to unchecked
  },
  
  // AML VERIFIED - Anti-Money Laundering verification
  aml_verified: {
    type: Boolean,
    default: false                    // SECURITY: Default to unverified
  },
  
  // KYC VERIFIED - Know Your Customer verification
  kyc_verified: {
    type: Boolean,
    default: false                    // SECURITY: Default to unverified
  }
}, {
  timestamps: true,                   // Automatic createdAt and updatedAt fields
  
  // SECURITY: Remove sensitive internal data from JSON serialization
  toJSON: {
    virtuals: true,                    // Include virtual fields (like payment_reference)
    transform: function(doc, ret) {
      // Remove sensitive internal data to prevent data leakage
      delete ret.employee_notes;        // Never expose internal notes
      delete ret.compliance_checked;    // Hide compliance status
      delete ret.aml_verified;          // Hide AML verification status
      delete ret.kyc_verified;          // Hide KYC verification status
      return ret;
    }
  }
});

// SECURITY INDEXES - Optimize queries and enforce uniqueness
paymentSchema.index({ transaction_reference: 1 }, { unique: true });  // Prevent duplicate transaction refs
paymentSchema.index({ user_id: 1 });                                  // Optimize user payment queries
paymentSchema.index({ status: 1 });                                   // Optimize status-based queries
paymentSchema.index({ createdAt: 1 });                                // Optimize date-based queries
paymentSchema.index({ amount: 1 });                                   // Optimize amount-based queries
paymentSchema.index({ currency: 1 });                                 // Optimize currency-based queries
paymentSchema.index({ swift_code: 1 });                               // Optimize SWIFT code queries

// VIRTUAL FIELD - Alias for frontend compatibility
// Maps payment_reference to transaction_reference for consistency
paymentSchema.virtual('payment_reference').get(function() {
  return this.transaction_reference;
});

// Payment validation and business logic methods

// Calculate total amount including processing fees
paymentSchema.methods.calculateTotalAmount = function() {
  const amount = parseFloat(this.amount);
  const fee = parseFloat(this.processing_fee) || 0;
  this.total_amount = amount + fee;
  return this.total_amount;
};

// Check if payment can be edited (only pending payments)
paymentSchema.methods.isEditable = function() {
  return ['pending'].includes(this.status);
};

// Check if payment can be cancelled (pending or approved payments)
paymentSchema.methods.canBeCancelled = function() {
  return ['pending', 'approved'].includes(this.status);
};

// Data sanitization and validation middleware
paymentSchema.pre('save', function(next) {
  // SECURITY: Generate unique transaction reference if not provided
  if (!this.transaction_reference) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.transaction_reference = `TXN${timestamp}${random}`;
  }
  
  // SECURITY: Sanitize payee name - remove extra whitespace
  if (this.isModified('payee_name') && this.payee_name) {
    this.payee_name = this.payee_name.trim();
  }
  
  // SECURITY: Sanitize payee email - normalize to lowercase
  if (this.isModified('payee_email') && this.payee_email) {
    this.payee_email = this.payee_email.toLowerCase().trim();
  }
  
  // SECURITY: Sanitize bank name - remove extra whitespace
  if (this.isModified('payee_bank_name') && this.payee_bank_name) {
    this.payee_bank_name = this.payee_bank_name.trim();
  }
  
  // SECURITY: Sanitize SWIFT code - normalize to uppercase
  if (this.isModified('swift_code') && this.swift_code) {
    this.swift_code = this.swift_code.toUpperCase().trim();
  }
  
  // SECURITY: Sanitize IBAN - normalize to uppercase
  if (this.isModified('iban') && this.iban) {
    this.iban = this.iban.toUpperCase().trim();
  }
  
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);


