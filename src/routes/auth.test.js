import request from 'supertest';
import express from 'express';
import authRouter from './auth';
import { authenticate } from '../middleware/auth';
import { login, register, refresh } from '../services/auth';

jest.mock('../services/auth');
jest.mock('../middleware/auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return a token on successful login', async () => {
      login.mockResolvedValue('mock_token');
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ token: 'mock_token' });
      expect(login).toHaveBeenCalledWith('test@example.com', 'password');
    });

    it('should return 401 on failed login', async () => {
      login.mockRejectedValue(new Error('Invalid credentials'));
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });
      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ message: 'Invalid credentials' });
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      register.mockResolvedValue({ id: 'user_123', email: 'test@example.com', role: 'client' });
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password', role: 'client' });
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({ id: 'user_123', email: 'test@example.com', role: 'client' });
      expect(register).toHaveBeenCalledWith('test@example.com', 'password', 'client');
    });

    it('should return 400 if user already exists', async () => {
      register.mockRejectedValue(new Error('User already exists'));
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password', role: 'client' });
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ message: 'User already exists' });
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return a new token for an authenticated user', async () => {
      const mockUser = { sub: 'usr_authenticated', role: 'client' };
      authenticate.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      refresh.mockResolvedValue('new_mock_token');

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer valid_token');

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ token: 'new_mock_token' });
      expect(authenticate).toHaveBeenCalledTimes(1);
      expect(refresh).toHaveBeenCalledWith(mockUser.sub, mockUser.role);
    });

    it('should return 401 if not authenticated', async () => {
      authenticate.mockImplementation((req, res, next) => {
        res.sendStatus(401);
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.statusCode).toBe(401);
      expect(refresh).not.toHaveBeenCalled();
    });

    it('should return 401 if refresh service fails', async () => {
      const mockUser = { sub: 'usr_authenticated', role: 'client' };
      authenticate.mockImplementation((req, res, next) => {
        req.user = mockUser;
        next();
      });
      refresh.mockRejectedValue(new Error('Refresh failed'));

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer valid_token');

      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ message: 'Refresh failed' });
    });
  });
});
