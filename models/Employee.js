// Employee model - static users, no registration process allowed
const mongoose = require('mongoose');
const { Schema } = mongoose;
const argon2 = require('argon2');

const employeeSchema = new Schema({
  // EMPLOYEE ID VALIDATION - Alphanumeric only, prevents special character injection
  employee_id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    minlength: 5,
    maxlength: 20,
    match: /^[a-zA-Z0-9]+$/  // SECURITY: Only alphanumeric characters allowed
  },

  // FULL NAME VALIDATION - Prevents XSS and injection attacks
  full_name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
    match: /^[a-zA-Z\s'-]+$/  // SECURITY: Only allow letters, spaces, hyphens, apostrophes
  },

  // EMAIL VALIDATION - Standard email format, prevents injection
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/  // SECURITY: Standard email regex
  },

  // PASSWORD HASH - Argon2id hashing (never stored in plaintext)
  password_hash: {
    type: String,
    required: true,
    select: false  // SECURITY: Never include in queries by default
  },

  // ROLE - Always 'employee' for this model
  role: {
    type: String,
    default: 'employee',
    enum: ['employee'],  // SECURITY: Only employee role allowed
    immutable: true  // Cannot be changed after creation
  },

  // DEPARTMENT - Employee department assignment
  department: {
    type: String,
    required: true,
    trim: true,
    enum: ['Payments', 'Customer Service', 'Administration', 'Finance', 'IT']  // SECURITY: Whitelist departments
  },

  // ACCOUNT LOCKOUT - Brute force protection
  failed_login_attempts: {
    type: Number,
    default: 0
  },
  locked_until: {
    type: Date,
    default: null
  },

  // ACCOUNT STATUS
  is_active: {
    type: Boolean,
    default: true
  },

  // AUDIT TRAIL
  last_login: {
    type: Date,
    default: null
  },
  last_login_ip: {
    type: String,
    default: null
  }
}, {
  timestamps: true,  // Automatically adds createdAt and updatedAt
  toJSON: { virtuals: true, transform: function(doc, ret) {
    // SECURITY: Removes sensitive fields from JSON output
    delete ret.password_hash;
    delete ret.failed_login_attempts;
    delete ret.locked_until;
    return ret;
  }}
});

// SECURITY: Indexes for performance and uniqueness
employeeSchema.index({ employee_id: 1 }, { unique: true });
employeeSchema.index({ email: 1 }, { unique: true });
employeeSchema.index({ role: 1 });

// SECURITY: Pre-save middleware for data sanitization
employeeSchema.pre('save', function(next) {
  if (this.isModified('full_name')) {
    this.full_name = this.full_name.trim();
  }
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }
  if (this.isModified('employee_id')) {
    this.employee_id = this.employee_id.toUpperCase().trim();
  }
  next();
});

// SECURITY: Instance method to verify password using Argon2id
employeeSchema.methods.verifyPassword = async function(password) {
  try {
    return await argon2.verify(this.password_hash, password);
  } catch (error) {
    throw new Error('Password verification failed');
  }
};

// SECURITY: Instance method to increment failed login attempts
employeeSchema.methods.incrementFailedLoginAttempts = async function() {
  this.failed_login_attempts += 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.failed_login_attempts >= 5) {
    this.locked_until = new Date(Date.now() + 30 * 60 * 1000);  // 30 minutes
  }
  
  await this.save();
};

// SECURITY: Instance method to reset failed login attempts
employeeSchema.methods.resetFailedLoginAttempts = async function() {
  this.failed_login_attempts = 0;
  this.locked_until = null;
  await this.save();
};

// SECURITY: Instance method to check if account is locked
employeeSchema.methods.isLocked = function() {
  return this.locked_until && this.locked_until > new Date();
};

// Static method to create employee with hashed password (for seeding)
employeeSchema.statics.createEmployee = async function(employeeData) {
  const password_hash = await argon2.hash(employeeData.password, {
    type: argon2.argon2id,
    memoryCost: 524288, 
    timeCost: 2,
    parallelism: 1
  });

  const employee = new this({
    employee_id: employeeData.employee_id,
    full_name: employeeData.full_name,
    email: employeeData.email,
    password_hash: password_hash,
    role: 'employee',
    department: employeeData.department
  });

  return await employee.save();
};

module.exports = mongoose.model('Employee', employeeSchema);

