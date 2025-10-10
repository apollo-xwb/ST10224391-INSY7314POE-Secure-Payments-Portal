const mongoose = require('mongoose');
const { Schema } = mongoose;

const sessionSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session_token: {
    type: String,
    required: false,
    maxlength: 500,
    sparse: true // Allow multiple null values
  },
  refresh_token: {
    type: String,
    maxlength: 500,
    sparse: true // Allow multiple null values
  },
  ip_address: {
    type: String,
    maxlength: 45, // IPv6 compatible
    match: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^127\.0\.0\.1$/
  },
  user_agent: {
    type: String
  },
  device_fingerprint: {
    type: String,
    maxlength: 64
  },
  is_active: {
    type: Boolean,
    default: true
  },
  expires_at: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Expiration date must be in the future'
    }
  },
  refresh_expires_at: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > new Date();
      },
      message: 'Refresh expiration date must be in the future'
    }
  },
  last_activity: {
    type: Date,
    default: Date.now
  },
  login_method: {
    type: String,
    enum: ['password', 'two_factor', 'social'],
    default: 'password'
  },
  is_remember_me: {
    type: Boolean,
    default: false
  },
  location_country: {
    type: String,
    maxlength: 100
  },
  location_city: {
    type: String,
    maxlength: 100
  },
  risk_score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  security_flags: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Remove sensitive data
      delete ret.session_token;
      delete ret.refresh_token;
      delete ret.device_fingerprint;
      delete ret.security_flags;
      return ret;
    }
  }
});

// Indexes
sessionSchema.index({ session_token: 1 }, { unique: true, sparse: true });
sessionSchema.index({ refresh_token: 1 }, { unique: true, sparse: true });
sessionSchema.index({ user_id: 1 });
sessionSchema.index({ is_active: 1 });
sessionSchema.index({ expires_at: 1 });
sessionSchema.index({ last_activity: 1 });
sessionSchema.index({ ip_address: 1 });

// Instance methods
sessionSchema.methods.isExpired = function() {
  return new Date() > this.expires_at;
};

sessionSchema.methods.isRefreshExpired = function() {
  return this.refresh_token && new Date() > this.refresh_expires_at;
};

sessionSchema.methods.extend = async function(minutes = 15) {
  this.expires_at = new Date(Date.now() + minutes * 60 * 1000);
  this.last_activity = new Date();
  return this.save();
};

sessionSchema.methods.revoke = async function() {
  this.is_active = false;
  this.session_token = null;
  this.refresh_token = null;
  return this.save();
};

sessionSchema.methods.updateActivity = async function() {
  this.last_activity = new Date();
  return this.save();
};

sessionSchema.methods.calculateRiskScore = function() {
  let riskScore = 0;
  
  // Check for suspicious patterns
  if (this.security_flags) {
    if (this.security_flags.new_device) riskScore += 20;
    if (this.security_flags.new_location) riskScore += 15;
    if (this.security_flags.unusual_time) riskScore += 10;
    if (this.security_flags.multiple_failed_attempts) riskScore += 25;
    if (this.security_flags.suspicious_user_agent) riskScore += 15;
  }
  
  // Check session age
  const sessionAge = Date.now() - new Date(this.createdAt).getTime();
  if (sessionAge > 24 * 60 * 60 * 1000) { // More than 24 hours
    riskScore += 10;
  }
  
  this.risk_score = Math.min(riskScore, 100);
  return this.risk_score;
};

// Pre-save middleware
sessionSchema.pre('save', function(next) {
  // Set default expiration times
  if (!this.expires_at) {
    this.expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }
  if (!this.refresh_expires_at && this.refresh_token) {
    this.refresh_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
  this.last_activity = new Date();
  next();
});

module.exports = mongoose.model('Session', sessionSchema);
