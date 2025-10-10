# 🚀 Complete Setup Instructions for Secure Payments Portal

This guide will walk you through setting up the complete Secure Customer International Payments Portal for the INSY7314 POE Task 2.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** 8.0.0 or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **mkcert** for HTTPS certificates ([Installation Guide](https://github.com/FiloSottile/mkcert#installation))

## 🏗️ Step 1: Project Setup

### 1.1 Create Project Directory
```bash
# Create and navigate to your project directory
mkdir secure-payments-portal
cd secure-payments-portal
```

### 1.2 Initialize Git Repository
```bash
# Initialize git repository
git init

# Create .gitignore file
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
client/node_modules/

# Environment variables
.env
.env.local
.env.production

# Database
database.sqlite
*.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.nyc_output

# Build outputs
client/dist/
client/build/
dist/
build/

# Certificates and Keys (IMPORTANT: These are .example files for lecturer)
localhost+2-key.pem
localhost+2.pem
certs/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Test results
test-results/
security-test-results.json
snyk-results.json
EOF
```

## 🔧 Step 2: Backend Setup

### 2.1 Create Backend Structure
```bash
# Create backend directories
mkdir -p models middleware routes scripts services

# Copy all backend files from the provided code
# The server.js, models, middleware, and routes are already provided
```

### 2.2 Install Backend Dependencies
```bash
# Initialize package.json
npm init -y

# Install production dependencies
npm install express cors helmet express-rate-limit express-slow-down argon2 jsonwebtoken mongoose connect-mongo dotenv express-validator cookie-parser express-session bcryptjs uuid compression morgan

# Install development dependencies
npm install --save-dev nodemon concurrently jest supertest eslint prettier audit-ci cross-env husky lint-staged npm-check-updates snyk
```

### 2.3 Create Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your secure values
nano .env
```

**Important**: Update these values in your `.env` file:
```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/secure-payments-portal

# Security Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
SESSION_SECRET=your-super-secret-session-key-change-in-production-min-32-chars

# HTTPS Configuration
ENABLE_HTTPS=true
HTTPS_KEY_PATH=./localhost+2-key.pem
HTTPS_CERT_PATH=./localhost+2.pem
```

## ⚛️ Step 3: Frontend Setup

### 3.1 Create Frontend with Vite
```bash
# Create React app with Vite
npm create vite@latest client -- --template react

# Navigate to client directory
cd client

# Install dependencies
npm install

# Install additional dependencies
npm install react-router-dom axios react-hook-form @tanstack/react-query react-hot-toast lucide-react clsx tailwind-merge dompurify js-cookie date-fns

# Install development dependencies
npm install --save-dev @types/react @types/react-dom @vitejs/plugin-react eslint eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh prettier tailwindcss autoprefixer postcss
```

### 3.2 Configure Tailwind CSS
```bash
# Initialize Tailwind CSS
npx tailwindcss init -p

# The tailwind.config.js and postcss.config.js files are already provided
```

### 3.3 Create Client Environment
```bash
# Create client environment file
cp env.example .env

# Edit client .env file
nano .env
```

**Client Environment Variables**:
```env
# API Configuration
VITE_API_URL=https://localhost:3001/api

# App Configuration
VITE_APP_NAME=Secure Payments Portal
VITE_APP_VERSION=1.0.0

# Security
VITE_ENABLE_DEVTOOLS=false
```

## 🔒 Step 4: Security Configuration

### 4.1 Setup HTTPS Certificates
```bash
# Install mkcert (if not already installed)
# Windows: choco install mkcert
# macOS: brew install mkcert
# Linux: See mkcert documentation

# Install local CA
mkcert -install

# Generate certificates for localhost
mkcert localhost 127.0.0.1 ::1

# This creates:
# - localhost+2.pem (certificate)
# - localhost+2-key.pem (private key)
```

**⚠️ IMPORTANT FOR LECTURER**: The actual certificate files (`localhost+2.pem` and `localhost+2-key.pem`) are provided as `.example` files in the repository. The lecturer should:

1. Copy `localhost+2.pem.example` to `localhost+2.pem`
2. Copy `localhost+2-key.pem.example` to `localhost+2-key.pem`
3. Or generate new certificates using mkcert as shown above

### 4.2 Configure Security Scripts
```bash
# Make security test script executable
chmod +x scripts/security-test.sh

# Run initial security test
./scripts/security-test.sh
```

## 🗄️ Step 5: Database Setup

### 5.1 MongoDB Atlas Configuration
The application uses MongoDB Atlas (cloud database). The connection is configured in the `.env` file:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/secure-payments-portal
```

### 5.2 Database Models
The database models are already provided in the code:
- **User Model**: User authentication and profile data
- **Payment Model**: International payment transactions
- **Session Model**: User session management

The database will be automatically connected when you start the server.

## 🚀 Step 6: Running the Application

### 6.1 Development Mode with HTTPS
```bash
# From the root directory, start both servers
npm run ssl:dev

# This will start:
# - Backend server on https://localhost:3001
# - Frontend server on http://localhost:5173
```

### 6.2 Individual Servers
```bash
# Backend only (HTTPS)
npm run ssl:dev

# Frontend only (from root directory)
cd client && npm run dev
```

### 6.3 Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: https://localhost:3001
- **Health Check**: https://localhost:3001/health

## 🧪 Step 7: Testing and Validation

### 7.1 Run Security Tests
```bash
# Run comprehensive security tests
npm run security:all

# Or run individual tests:
npm run security:audit    # Dependency audit
npm run security:scan     # Security scan
npm run lint             # Code quality check
```

### 7.2 Run Application Tests
```bash
# Run tests
npm test

# Run linting
npm run lint

# Run security audit
npm audit
```

### 7.3 Manual Testing Checklist

#### Authentication Testing
- [ ] User registration with valid data
- [ ] User registration with invalid data (should fail)
- [ ] User login with correct credentials
- [ ] User login with incorrect credentials (should fail)
- [ ] Password strength validation
- [ ] Account lockout after failed attempts

#### Payment Testing
- [ ] Create new payment with valid data
- [ ] Create payment with invalid SWIFT code (should fail)
- [ ] Create payment with invalid IBAN (should fail)
- [ ] Edit pending payment
- [ ] Cancel pending payment
- [ ] View payment history
- [ ] Payment amount validation
- [ ] Currency conversion testing

#### Security Testing
- [ ] HTTPS enforcement (backend)
- [ ] Rate limiting (try multiple rapid requests)
- [ ] Input validation (try SQL injection attempts)
- [ ] XSS protection (try script injection)
- [ ] Session security (check cookies)
- [ ] Session hijacking protection
- [ ] MITM protection (HTTPS)

## 🔧 Step 8: DevSecOps Configuration

### 8.1 Git Hooks Setup
```bash
# Install git hooks
npm run prepare

# This sets up:
# - Pre-commit hooks for linting
# - Pre-push hooks for security checks
```

### 8.2 CircleCI Setup (Optional)
```bash
# Create CircleCI directory
mkdir -p .circleci

# The config.yml file is already provided
# You'll need to:
# 1. Create a CircleCI account
# 2. Connect your GitHub repository
# 3. Set up environment variables in CircleCI dashboard
```

### 8.3 SonarQube Setup (Optional)
```bash
# The sonar-project.properties file is already provided
# You'll need to:
# 1. Create a SonarCloud account
# 2. Create a new project
# 3. Get your project key and organization
# 4. Update sonar-project.properties with your details
# 5. Set SONAR_TOKEN in CircleCI environment variables
```

## 📱 Step 9: Application Usage

### 9.1 First Time Setup
1. Navigate to http://localhost:5173
2. Click "Create a new account"
3. Fill in the registration form with valid data
4. Submit the form
5. You'll be automatically logged in

### 9.2 Creating Your First Payment
1. Click "New Payment" from the dashboard
2. Fill in payment details:
   - Amount (e.g., 100.00)
   - Currency (e.g., USD)
   - Payee name (e.g., John Doe)
   - Account number (e.g., 1234567890)
   - Bank name (e.g., Bank of America)
   - Bank country (e.g., United States)
   - SWIFT code (e.g., BOFAUS3N)
3. Click "Create Payment"
4. View the payment in your dashboard

### 9.3 Testing Security Features
1. Try logging in with wrong password multiple times (account should lock)
2. Try creating a payment with invalid SWIFT code
3. Check browser developer tools for secure cookies
4. Verify HTTPS is working (backend)
5. Test rate limiting by making rapid requests



## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill processes on ports 3001 and 5173
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

#### Database Connection Issues
```bash
# Check MongoDB Atlas connection string
# Ensure network access is configured
# Verify username and password
```

#### Certificate Issues
```bash
# Regenerate certificates
rm -f localhost+2.pem localhost+2-key.pem
mkcert localhost 127.0.0.1 ::1
```

#### Dependency Issues
```bash
# Clean install
rm -rf node_modules client/node_modules
npm install
cd client && npm install
```

#### Environment Variables
```bash
```

## 📚 Additional Resources

### Security Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Argon2 Documentation](https://github.com/P-H-C/phc-winner-argon2)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)

### React Documentation
- [React Documentation](https://reactjs.org/docs/)
- [React Router](https://reactrouter.com/)
- [React Hook Form](https://react-hook-form.com/)
- [TanStack Query](https://tanstack.com/query/latest)

### Node.js Documentation
- [Express.js](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/)





## 🔒 Security Features Implemented

### Password Security (10 Marks)
- ✅ Argon2id password hashing with secure parameters
- ✅ Configurable memory cost, time cost, and parallelism
- ✅ Auto-generated salts for each password

### Input Whitelisting (10 Marks)
- ✅ Comprehensive RegEx patterns for all inputs
- ✅ SWIFT code validation
- ✅ IBAN validation
- ✅ Email validation
- ✅ Amount validation
- ✅ Input sanitization and XSS prevention

### SSL/TLS Security (20 Marks)
- ✅ HTTPS enforcement for backend
- ✅ Self-signed certificates for development
- ✅ HSTS headers configured
- ✅ Certificate pinning support
- ✅ Secure cookie configuration

### Attack Protection (30 Marks)
- ✅ Session Jacking: Session regeneration, IP binding, concurrent limits
- ✅ Clickjacking: X-Frame-Options headers
- ✅ SQL Injection: MongoDB ODM protection
- ✅ XSS: Input sanitization, CSP headers
- ✅ MITM: HTTPS enforcement, HSTS
- ✅ DDoS: Rate limiting, request size limits, timeouts

### DevSecOps Pipeline (10 Marks)
- ✅ Git hooks for pre-commit security checks
- ✅ Automated security testing
- ✅ Dependency vulnerability scanning
- ✅ Code quality checks with ESLint
- ✅ Security audit automation

---


**⚠️ Note for Lecturer**: All sensitive files (certificates, keys, secrets) are provided as `.example` files. The actual files cannot be pushed to Git for security reasons.