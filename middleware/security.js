// Security middleware - headers and input sanitization
const rateLimit = require('express-rate-limit');

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // SECURITY: Prevent clickjacking attacks
  // X-Frame-Options: DENY prevents the page from being embedded in frames
  res.setHeader('X-Frame-Options', 'DENY');
  
  // SECURITY: Prevent MIME type sniffing attacks
  // X-Content-Type-Options: nosniff prevents browsers from MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // SECURITY: Enable XSS protection in browsers
  // X-XSS-Protection: 1; mode=block enables XSS filtering and blocks requests
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // SECURITY: Control referrer information leakage
  // Referrer-Policy: strict-origin-when-cross-origin limits referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // SECURITY: Disable unnecessary browser features
  // Permissions-Policy: Disables geolocation, microphone, camera access
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // SECURITY: Remove server information disclosure
  // Remove X-Powered-By header to hide server technology
  res.removeHeader('X-Powered-By');
  
  next();
};

// Input sanitization middleware - prevents XSS and injection attacks
const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs to prevent XSS and injection attacks
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // SECURITY: Remove null bytes and control characters
    // These can be used for injection attacks and buffer overflows
    // eslint-disable-next-line no-control-regex
    const sanitized = str.replace(/[\u0000-\u001F\u007F]/g, '')
              // SECURITY: Remove script tags and their content
              // Prevents <script>alert('XSS')</script> type attacks
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              // SECURITY: Remove script tag attributes
              // Prevents <img src="javascript:alert('XSS')"> type attacks
              .replace(/<script[^>]*>/gi, '')
              // SECURITY: Remove JavaScript protocol handlers
              // Prevents javascript:alert() type attacks
              .replace(/javascript:/gi, '')
              // SECURITY: Remove event handler attributes
              // Prevents onclick=, onload=, etc. injection attacks
              .replace(/on\w+\s*=/gi, '')
              // SECURITY: Remove other dangerous HTML tags
              // Prevents <iframe>, <object>, <embed> attacks
              .replace(/<(iframe|object|embed|form|input|textarea|select|button)[^>]*>[\s\S]*?<\/(iframe|object|embed|form|input|textarea|select|button)>/gi, '')
              .replace(/<(iframe|object|embed|form|input|textarea|select|button)[^>]*>/gi, '')
              // SECURITY: Remove HTML entities that could be used for XSS
              // Prevents &lt;script&gt; type attacks
              .replace(/&lt;script[^&]*&gt;/gi, '')
              // SECURITY: Remove leading/trailing whitespace
              .trim();
    
    // SECURITY: If the string contains only malicious content and becomes empty,
    // return a safe placeholder to prevent validation errors while maintaining security
    if (sanitized === '' && str.trim() !== '') {
      // Check if the original string contained only malicious content
      const hasOnlyMaliciousContent = /^[\s]*<script[\s\S]*<\/script>[\s]*$|^[\s]*<iframe[\s\S]*<\/iframe>[\s]*$|^[\s]*<object[\s\S]*<\/object>[\s]*$|^[\s]*<embed[\s\S]*<\/embed>[\s]*$|^[\s]*<script[^>]*>[\s]*$/gi.test(str);
      
      if (hasOnlyMaliciousContent) {
        // Return a safe placeholder that indicates malicious content was removed
        return '[Content removed for security]';
      }
    }
    
    return sanitized;
  };

  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // SECURITY: Skip sanitization for password fields to preserve exact password values
      // Passwords are hashed and validated separately, so sanitization could cause mismatches
      if (key.toLowerCase().includes('password')) {
        // Preserve password exactly as-is, no modification whatsoever
        sanitized[key] = value;
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Sanitization] Skipping password field "${key}", preserving value (length: ${value?.length || 0})`);
        }
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // More lenient in development
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Rate limiting for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 payment requests per hour
  message: {
    error: 'Too many payment requests, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Request size limiter
const requestSizeLimiter = (req, res, next) => {
  const contentLength = parseInt(req.get('content-length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'Request entity too large',
      message: 'Request size exceeds maximum allowed limit'
    });
  }
  
  next();
};

// IP whitelist middleware (for admin endpoints)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      return next();
    }
    
    res.status(403).json({
      error: 'Access denied',
      message: 'Your IP address is not authorized to access this resource'
    });
  };
};

// Device fingerprinting middleware
const deviceFingerprint = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const acceptLanguage = req.get('Accept-Language') || '';
  const acceptEncoding = req.get('Accept-Encoding') || '';
  
  // Create a simple device fingerprint
  const fingerprint = require('crypto')
    .createHash('sha256')
    .update(userAgent + acceptLanguage + acceptEncoding)
    .digest('hex');
  
  req.deviceFingerprint = fingerprint;
  next();
};

// Security event logging
const securityLogger = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log security events
    if (res.statusCode >= 400) {
      const securityEvent = {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        deviceFingerprint: req.deviceFingerprint,
        userId: req.user?.id || null
      };
      
      // In production, send to security monitoring service
      console.warn('Security Event:', securityEvent);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  securityHeaders,
  sanitizeInput,
  authLimiter,
  paymentLimiter,
  apiLimiter,
  requestSizeLimiter,
  ipWhitelist,
  deviceFingerprint,
  securityLogger
};
