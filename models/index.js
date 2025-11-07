const mongoose = require('mongoose');

// Database configuration for MongoDB Atlas
const config = {
  development: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/secure-payments-portal',
    options: {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    }
  },
  test: {
    uri: process.env.MONGODB_URI_TEST || 'mongodb+srv://username:password@cluster.mongodb.net/secure-payments-portal-test',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  production: {
    uri: process.env.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      ssl: true,
      sslValidate: true,
      authSource: 'admin', // Specify the authentication database
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Connect to MongoDB Atlas
const connectDB = async () => {
  try {
    await mongoose.connect(dbConfig.uri, dbConfig.options);
    console.log('✅ MongoDB Atlas connected successfully');
    console.log(`📊 Connected to: ${mongoose.connection.host}`);
    console.log(`🗄️  Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB Atlas');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB Atlas connection closed through app termination');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  console.log('MongoDB Atlas connection closed through app termination');
  process.exit(0);
});

// Import models
const User = require('./User');
const Payment = require('./Payment');
const Session = require('./Session');
const Employee = require('./Employee');

// Export models and connection function
module.exports = {
  connectDB,
  mongoose,
  User,
  Payment,
  Session,
  Employee
};
