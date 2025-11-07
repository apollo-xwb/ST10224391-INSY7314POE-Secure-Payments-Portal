// Main server file for the Secure Payments Portal
// See REFERENCES.md for technology references and citations

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
const employeeAuthRoutes = require('./routes/employee-auth');
const employeePaymentRoutes = require('./routes/employee-payments');
const notificationRoutes = require('./routes/notifications');
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
    // Skip rate limiting for health checks and OPTIONS requests (CORS preflight)
    return req.path === '/health' || req.method === 'OPTIONS';
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
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: (req) => {
    // Skip OPTIONS requests (CORS preflight)
    return req.method === 'OPTIONS';
  }
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: () => 500, // begin adding 500ms of delay per request above 50
  skip: (req) => {
    // Skip OPTIONS requests (CORS preflight)
    return req.method === 'OPTIONS';
  }
});

// CORS Configuration - MUST BE BEFORE RATE LIMITING
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'production') {
      // Production: Only allow specific domains
      const allowedOrigins = ['https://yourdomain.com'];
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // Development: Allow all localhost origins (both http and https)
      const allowedPatterns = [
        /^https?:\/\/localhost(:\d+)?$/,
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
        /^https?:\/\/localhost:5173$/,
        /^https?:\/\/localhost:5174$/
      ];
      
      const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
      if (isAllowed) {
        callback(null, true);
      } else {
        // In development, allow all origins for flexibility
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Explicit OPTIONS handler as fallback for CORS preflight
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  
  // In development, allow all localhost origins
  if (process.env.NODE_ENV !== 'production') {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(204).send();
  } else {
    // In production, check allowed origins
    const allowedOrigins = ['https://yourdomain.com'];
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.status(204).send();
    } else {
      res.status(403).send('Not allowed by CORS');
    }
  }
});

// Apply rate limiting AFTER CORS
app.use(limiter);
app.use(speedLimiter);

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
app.use('/api/notifications', notificationRoutes);
app.use('/api/employee/auth', authLimiter, employeeAuthRoutes);
app.use('/api/employee', employeePaymentRoutes);
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
