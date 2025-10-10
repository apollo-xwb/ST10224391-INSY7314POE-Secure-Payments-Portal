const request = require('supertest');
const app = require('./app');
const { User, Session, sequelize } = require('../models');

describe('Authentication System', () => {
  beforeAll(async () => {
    // Sync database for tests
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Clean up database before each test
    await Session.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    // Clean up after all tests
    await Session.destroy({ where: {} });
    await User.destroy({ where: {} });
    await sequelize.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const timestamp = Date.now();
      const userData = {
        fullName: 'John Doe',
        idNumber: `TEST${timestamp}`,
        accountNumber: `${timestamp}`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.full_name).toBe('John Doe');
      expect(response.body.data.user.id_number).toBe(`TEST${timestamp}`);
      expect(response.body.data.user.account_number).toBe(`${timestamp}`);
      expect(response.body.data.user.password_hash).toBeUndefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should reject registration with duplicate ID number', async () => {
      const timestamp = Date.now();
      const userData = {
        fullName: 'John Doe',
        idNumber: `TEST${timestamp}`,
        accountNumber: `${timestamp}`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register second user with same ID number
      const duplicateUserData = {
        fullName: 'Jane Doe',
        idNumber: userData.idNumber, // Use the same ID number
        accountNumber: `${timestamp + 1}`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('ID number already exists');
    });

    it('should reject registration with duplicate account number', async () => {
      const timestamp = Date.now();
      const userData = {
        fullName: 'John Doe',
        idNumber: `TEST${timestamp}`,
        accountNumber: `${timestamp}`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register second user with same account number
      const duplicateUserData = {
        fullName: 'Jane Doe',
        idNumber: `TEST${timestamp + 1}`,
        accountNumber: userData.accountNumber, // Use the same account number
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUserData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Account number already exists');
    });

    it('should reject registration with invalid password', async () => {
      const timestamp = Date.now();
      const userData = {
        fullName: 'John Doe',
        idNumber: `TEST${timestamp}`,
        accountNumber: `${timestamp}`,
        password: 'weak',
        confirmPassword: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Password');
    });

    it('should reject registration with mismatched passwords', async () => {
      const timestamp = Date.now();
      const userData = {
        fullName: 'John Doe',
        idNumber: `TEST${timestamp}`,
        accountNumber: `${timestamp}`,
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Passwords do not match');
    });

    it('should reject registration with invalid full name', async () => {
      const timestamp = Date.now();
      const userData = {
        fullName: 'John123',
        idNumber: `TEST${timestamp}`,
        accountNumber: `${timestamp}`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Full name');
    });

    it('should reject registration with invalid ID number', async () => {
      const timestamp = Date.now();
      const userData = {
        fullName: 'John Doe',
        idNumber: '123',
        accountNumber: `${timestamp}`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('ID number');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUserData;
    
    beforeEach(async () => {
      // Create a test user with unique data
      const timestamp = Date.now();
      testUserData = {
        fullName: 'John Doe',
        idNumber: `TEST${timestamp}`,
        accountNumber: `${timestamp}`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      await request(app)
        .post('/api/auth/register')
        .send(testUserData);
    });

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        idNumber: testUserData.idNumber,
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.full_name).toBe('John Doe');
      expect(response.body.data.user.id_number).toBe(testUserData.idNumber);
      expect(response.body.data.user.password_hash).toBeUndefined();
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        idNumber: testUserData.idNumber,
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid ID number or password');
    });

    it('should reject login with non-existent user', async () => {
      const loginData = {
        idNumber: 'NONEXISTENT',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('No account found');
    });

    it('should reject login with invalid ID number format', async () => {
      const loginData = {
        idNumber: '123',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('ID number');
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken;
    let user;

    beforeEach(async () => {
      // Create a test user and get token
      const timestamp = Date.now();
      const userData = {
        fullName: 'John Doe',
        idNumber: `TEST${timestamp}`,
        accountNumber: `${timestamp}`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Check if tokens exist in response
      if (registerResponse.body.data && registerResponse.body.data.tokens) {
        accessToken = registerResponse.body.data.tokens.accessToken;
        user = registerResponse.body.data.user;
      } else {
        // Fallback: try to login to get tokens
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            idNumber: userData.idNumber,
            password: userData.password
          });
        
        if (loginResponse.body.data && loginResponse.body.data.tokens) {
          accessToken = loginResponse.body.data.tokens.accessToken;
          user = loginResponse.body.data.user;
        }
      }
    });

    it('should return user data with valid token', async () => {
      // Ensure we have a valid token
      expect(accessToken).toBeDefined();
      expect(user).toBeDefined();
      
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.full_name).toBe('John Doe');
      expect(response.body.data.user.id_number).toBe(user.id_number);
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('No token provided');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('Token is malformed or invalid');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      // Create a test user and get refresh token
      const timestamp = Date.now();
      const userData = {
        fullName: 'John Doe',
        idNumber: `TEST${timestamp}`,
        accountNumber: `${timestamp}`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Check if tokens exist in response
      if (registerResponse.body.data && registerResponse.body.data.tokens) {
        refreshToken = registerResponse.body.data.tokens.refreshToken;
      } else {
        // Fallback: try to login to get tokens
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            idNumber: userData.idNumber,
            password: userData.password
          });
        
        if (loginResponse.body.data && loginResponse.body.data.tokens) {
          refreshToken = loginResponse.body.data.tokens.refreshToken;
        }
      }
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid refresh token');
    });

    it('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Refresh token is required');
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken;
    let refreshToken;

    beforeEach(async () => {
      // Create a test user and get tokens
      const timestamp = Date.now();
      const userData = {
        fullName: 'John Doe',
        idNumber: `TEST${timestamp}`,
        accountNumber: `${timestamp}`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Check if tokens exist in response
      if (registerResponse.body.data && registerResponse.body.data.tokens) {
        accessToken = registerResponse.body.data.tokens.accessToken;
        refreshToken = registerResponse.body.data.tokens.refreshToken;
      } else {
        // Fallback: try to login to get tokens
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            idNumber: userData.idNumber,
            password: userData.password
          });
        
        if (loginResponse.body.data && loginResponse.body.data.tokens) {
          accessToken = loginResponse.body.data.tokens.accessToken;
          refreshToken = loginResponse.body.data.tokens.refreshToken;
        }
      }
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');
    });

    it('should logout successfully even without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');
    });
  });
});
