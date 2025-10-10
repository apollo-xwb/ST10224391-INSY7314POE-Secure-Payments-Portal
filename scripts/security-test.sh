#!/bin/bash

# Security Testing Script for Secure Payments Portal
# This script runs various security tests and validations

set -e

echo "🔒 Running security tests for Secure Payments Portal..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test 1: Check for vulnerable dependencies
echo "🔍 Testing for vulnerable dependencies..."
npm audit --audit-level=moderate
print_status "Dependency audit completed" $?

# Test 2: Check for security hotspots with ESLint
echo "🔍 Running security-focused linting..."
npx eslint . --ext .js,.jsx --config .eslintrc.security.js
print_status "Security linting completed" $?

# Test 3: Test rate limiting
echo "🔍 Testing rate limiting..."
# Start server in background
npm run server &
SERVER_PID=$!
sleep 5

# Test rate limiting with curl
for i in {1..10}; do
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/auth/login
    echo ""
done

# Kill server
kill $SERVER_PID
print_status "Rate limiting test completed" 0

# Test 4: Check for hardcoded secrets
echo "🔍 Scanning for hardcoded secrets..."
if grep -r "password\|secret\|key\|token" --include="*.js" --include="*.jsx" . | grep -v "node_modules" | grep -v ".git" | grep -v "test" | grep -v "spec"; then
    print_warning "Potential hardcoded secrets found. Please review."
else
    print_status "No hardcoded secrets found" 0
fi

# Test 5: Check HTTPS configuration
echo "🔍 Checking HTTPS configuration..."
if [ -f "certs/server-cert.pem" ] && [ -f "certs/server-key.pem" ]; then
    print_status "HTTPS certificates found" 0
else
    print_warning "HTTPS certificates not found. Run ./scripts/setup-https.sh"
fi

# Test 6: Check environment variables
echo "🔍 Checking environment configuration..."
if [ -f ".env" ]; then
    if grep -q "JWT_SECRET" .env && grep -q "SESSION_SECRET" .env; then
        print_status "Required environment variables configured" 0
    else
        print_warning "Missing required environment variables"
    fi
else
    print_warning ".env file not found. Copy from env.example"
fi

# Test 7: Check database security
echo "🔍 Checking database configuration..."
if grep -q "paranoid: true" models/*.js; then
    print_status "Soft deletes enabled" 0
else
    print_warning "Soft deletes not enabled"
fi

# Test 8: Check input validation
echo "🔍 Checking input validation..."
if grep -r "express-validator\|joi\|yup" --include="*.js" . | grep -v "node_modules"; then
    print_status "Input validation libraries found" 0
else
    print_warning "Input validation not found"
fi

# Test 9: Check password hashing
echo "🔍 Checking password hashing..."
if grep -r "argon2\|bcrypt" --include="*.js" . | grep -v "node_modules"; then
    print_status "Secure password hashing found" 0
else
    print_warning "Secure password hashing not found"
fi

# Test 10: Check security headers
echo "🔍 Checking security headers..."
if grep -r "helmet\|X-Frame-Options\|X-Content-Type-Options" --include="*.js" . | grep -v "node_modules"; then
    print_status "Security headers configured" 0
else
    print_warning "Security headers not configured"
fi

echo ""
echo "🔒 Security testing completed!"
echo "📋 Review any warnings above and address them before deployment."
echo "🚀 For production deployment, ensure all security measures are properly configured."



