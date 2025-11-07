// Test setup file
require('dotenv').config();

// Ensure tests run against the test environment and DB
process.env.NODE_ENV = 'test';

// Use existing JWT secrets from .env if available, otherwise use test defaults
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
}
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'test-session-secret-key-for-testing-only';
}

// Use MONGODB_URI_TEST from .env if available, otherwise build a test DB URI from MONGODB_URI
if (!process.env.MONGODB_URI_TEST && process.env.MONGODB_URI) {
  // Append a separate database name to avoid touching the main DB
  const base = process.env.MONGODB_URI.split('?')[0].replace(/\/$/, '');
  const params = process.env.MONGODB_URI.includes('?') ? '?' + process.env.MONGODB_URI.split('?')[1] : '';
  process.env.MONGODB_URI_TEST = `${base}/secure-payments-portal-test${params}`;
}

// Increase timeout for database operations (MongoDB Atlas connections may take longer)
jest.setTimeout(30000);



