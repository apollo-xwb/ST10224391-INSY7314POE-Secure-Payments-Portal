// Anthropic. (2024). Claude AI Assistant - User model security implementation guidance.
// User model with security features
const mongoose = require('mongoose');
const { Schema } = mongoose;
const argon2 = require('argon2');

const userSchema = new Schema({
  // FULL NAME VALIDATION - Prevents XSS and injection attacks
    full_name: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[a-zA-Z\s'-]{2,50}$/.test(v);
        },
        message: 'Full name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes'
      }
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address'
      }
    },
    password_hash: {
      type: String,
      required: true,
      select: false // Never return password hash in queries
    },
    id_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[0-9]{13}$/.test(v);
        },
        message: 'ID number must be exactly 13 digits'
      }
    },
    account_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: function(v) {
          return /^[0-9]{10,12}$/.test(v);
        },
        message: 'Account number must be 10-12 digits'
      }
    },
    is_active: {
      type: Boolean,
      default: true
    },
    is_verified: {
      type: Boolean,
      default: false
    },
    failed_login_attempts: {
      type: Number,
      default: 0
    },
    locked_until: {
      type: Date,
      default: null
    },
    last_login: {
      type: Date,
      default: null
    },
    last_login_ip: {
      type: String,
      default: null
    }
  }, {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password_hash;
        delete ret.failed_login_attempts;
        delete ret.locked_until;
        return ret;
      }
    }
  });

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ id_number: 1 });
userSchema.index({ account_number: 1 });

// Password verification method
userSchema.methods.verifyPassword = async function(password) {
  try {
    return await argon2.verify(this.password_hash, password);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return this.locked_until && this.locked_until > new Date();
};

// Lock account after failed attempts
userSchema.methods.lockAccount = function() {
  this.failed_login_attempts = (this.failed_login_attempts || 0) + 1;
  
  if (this.failed_login_attempts >= 5) {
    // Lock for 30 minutes after 5 failed attempts
    this.locked_until = new Date(Date.now() + 30 * 60 * 1000);
  }
  
  return this.save();
};

// Reset failed login attempts
userSchema.methods.resetFailedAttempts = function() {
  this.failed_login_attempts = 0;
  this.locked_until = null;
  return this.save();
};

// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
  // Only hash if password_hash is modified and it's not already a hash
  if (!this.isModified('password_hash')) {
    return next();
  }
  
  // SECURITY: Check if password_hash is already hashed (starts with $argon2id)
  // This prevents double-hashing when password is already hashed during registration
  if (this.password_hash && this.password_hash.startsWith('$argon2id$')) {
    return next();
  }
  
  try {
    const hash = await argon2.hash(this.password_hash, {
      type: argon2.argon2id,
      memoryCost: parseInt(process.env.ARGON2_MEMORY_COST) || 524288,
      timeCost: parseInt(process.env.ARGON2_TIME_COST) || 2,
      parallelism: parseInt(process.env.ARGON2_PARALLELISM) || 1
    });
    this.password_hash = hash;
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware for data sanitization
userSchema.pre('save', function(next) {
  if (this.isModified('full_name')) {
    this.full_name = this.full_name.trim();
  }
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }
  if (this.isModified('id_number')) {
    this.id_number = this.id_number.trim();
  }
  if (this.isModified('account_number')) {
    this.account_number = this.account_number.trim();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
