/**
 * SECURE PAYMENTS PORTAL - MAIN SERVER FILE
 * 
 * This server implements enterprise-grade security measures following industry standards
 * and best practices for financial applications (Stallings & Brown, 2018; OWASP Foundation, 2021).
 * 
 * Security technologies implemented:
 * - Express.js: Web application framework (Express.js Documentation, 2024)
 * - Helmet.js: Security headers middleware (Helmet.js Documentation, 2024)
 * - Argon2id: Password hashing algorithm (Argon2 Documentation, 2024)
 * - MongoDB Atlas: Cloud database with encryption (MongoDB Atlas Documentation, 2024)
 * - HTTPS/TLS: Secure communication protocol (RFC 8446, 2018)
 * - JWT: JSON Web Tokens for authentication (Auth0, 2024)
 * 
 * References:
 * - Stallings, W. & Brown, L. (2018). Computer Security: Principles and Practice (4th ed.). Pearson.
 * - OWASP Foundation. (2021). OWASP Top 10 - 2021: The Ten Most Critical Web Application Security Risks.
 * - Express.js Documentation. (2024). Express - Fast, unopinionated, minimalist web framework for Node.js.
 * - Helmet.js Documentation. (2024). Helmet - Secure Express.js apps by setting various HTTP headers.
 * - Argon2 Documentation. (2024). Argon2 - The password hashing function that won the Password Hashing Competition.
 * - MongoDB Atlas Documentation. (2024). MongoDB Atlas - Multi-cloud database service.
 * - RFC 8446. (2018). The Transport Layer Security (TLS) Protocol Version 1.3.
 * - Auth0. (2024). JSON Web Token (JWT) - Introduction to JWT.
 * - Anthropic. (2024). Claude AI Assistant - Server security implementation guidance.
 */

const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./models');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const healthRoutes = require('./routes/health');
const { errorHandler } = require('./middleware/errorHandler');
const { securityHeaders, sanitizeInput } = require('./middleware/security');
// const { validateSession } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Headers and Middleware
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  xssFilter: true,
  noSniff: true,
  frameguard: { action: 'deny' }
};

// Add certificate pinning in production
if (process.env.NODE_ENV === 'production' && process.env.CERT_PIN_SHA256) {
  helmetConfig.hpkp = {
    maxAge: 7776000, // 90 days
    sha256s: [process.env.CERT_PIN_SHA256],
    includeSubDomains: true
  };
}

app.use(helmet(helmetConfig));

// Force HTTPS redirect in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Aggressive rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per 15 minutes
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many authentication attempts from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: () => 500 // begin adding 500ms of delay per request above 50
});

app.use(limiter);
app.use(speedLimiter);

// CORS Configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:5173', 'https://localhost:5173', 'http://localhost:3000', 'https://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing and compression
app.use(compression());
app.use(express.json({ limit: '1mb' })); // Reduced from 10mb for security
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000, () => { // 30 second timeout
    res.status(408).json({
      error: 'Request timeout',
      message: 'Request took too long to process'
    });
  });
  next();
});
app.use(cookieParser());

// Session configuration with MongoDB Atlas store
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-in-production',
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/secure-payments-portal',
    touchAfter: 24 * 3600, // lazy session update
    ttl: 30 * 60, // 30 minutes
    autoRemove: 'native', // Use MongoDB's native TTL
    crypto: {
      secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-in-production'
    }
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 60 * 1000, // 30 minutes
    sameSite: 'strict'
  },
  name: 'secure-session-id'
}));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Security middleware
app.use(securityHeaders);
app.use(sanitizeInput);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/health', healthRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
  });
}

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'The requested resource was not found on this server'
  });
});

    // Graceful shutdown handlers will be set up after server starts

// Start server with HTTPS support
const startServer = async () => {
  try {
    await connectDB();
    
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_HTTPS === 'true') {
      // HTTPS Server
      const httpsOptions = {
        key: fs.readFileSync(process.env.HTTPS_KEY_PATH || './certs/server-key.pem'),
        cert: fs.readFileSync(process.env.HTTPS_CERT_PATH || './certs/server-cert.pem')
      };
      
      const server = https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log(`🔒 HTTPS Server running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔒 Security features: HTTPS, Rate limiting, Helmet, CORS, Session security`);
        console.log(`🌐 Access your app at: https://localhost:${PORT}`);
      });
      
      // Graceful shutdown handlers
      process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        server.close(() => {
          console.log('Process terminated');
        });
      });

      process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down gracefully');
        server.close(() => {
          console.log('Process terminated');
        });
      });
      
      return server;
    } else {
      // HTTP Server (Development)
      const server = app.listen(PORT, () => {
        console.log(`🚀 HTTP Server running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔒 Security features: Rate limiting, Helmet, CORS, Session security`);
        console.log(`⚠️  WARNING: Running on HTTP. For production, enable HTTPS!`);
        console.log(`🌐 Access your app at: http://localhost:${PORT}`);
      });
      
      // Graceful shutdown handlers
      process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        server.close(() => {
          console.log('Process terminated');
        });
      });

      process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down gracefully');
        server.close(() => {
          console.log('Process terminated');
        });
      });
      
      return server;
    }
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().then(server => {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Promise Rejection at:', promise, 'reason:', err);
    server.close(() => {
      process.exit(1);
    });
  });
}).catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
