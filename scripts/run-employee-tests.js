#!/usr/bin/env node

// Runs tests for the Employee Portal

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Employee Portal - Comprehensive Test Suite');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Set test environment
process.env.NODE_ENV = 'test';

try {
  console.log('📋 Running Employee Portal Tests...\n');
  
  // Run Jest tests
  execSync('npm test -- __tests__/employee-portal.test.js', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ All Employee Portal tests passed!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Tests failed:', error.message);
  process.exit(1);
}


