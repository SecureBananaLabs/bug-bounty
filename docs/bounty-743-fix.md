typescript
// tests/api/registration.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import supertest from 'supertest';
import { app } from '../app';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const request = supertest(app);

describe('POST /api/auth/register', () => {
  const validUser = {
    email: 'test@example.com',
    password: 'TestPass123',
    role: 'USER',
    fullName: 'Jane Doe',
  };

  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: validUser.email },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: validUser.email },
    });
    await prisma.$disconnect();
  });

  describe('fullName validation', () => {
    it('should reject registration with missing fullName', async () => {
      const { email, password, role } = validUser;
      const response = await request
        .post('/api/auth/register')
        .send({ email, password, role })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(response.body.details.some((d: any) => d.path.includes('fullName'))).toBe(true);
    });

    it('should reject registration with empty fullName', async () => {
      const response = await request
        .post('/api/auth/register')
        .send({ ...validUser, fullName: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.some((d: any) => d.path.includes('fullName'))).toBe(true);
    });

    it('should reject registration with whitespace-only fullName', async () => {
      const response = await request
        .post('/api/auth/register')
        .send({ ...validUser, fullName: '   ' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject registration with invalid characters in fullName', async () => {
      const response = await request
        .post('/api/auth/register')
        .send({ ...validUser, fullName: 'Jane123 Doe' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
    });

    it('should accept registration with valid fullName', async () => {
      const response = await request
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', validUser.email);
      expect(response.body).toHaveProperty('fullName', validUser.fullName);
      expect(response.body).toHaveProperty('role', validUser.role);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should preserve fullName with special characters like hyphens and apostrophes', async () => {
      const userWithSpecialName = {
        ...validUser,
        email: 'special-name@example.com',
        fullName: "Mary-Jane O'Connor",
      };

      const response = await request
        .post('/api/auth/register')
        .send(userWithSpecialName)
        .expect(201);

      expect(response.body).toHaveProperty('fullName', userWithSpecialName.fullName);
    });
  });

  describe('other validations', () => {
    it('should reject registration with invalid email', async () => {
      const response = await request
        .post('/api/auth/register')
        .send({ ...validUser, email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with weak password', async () => {
      const response = await request
        .post('/api/auth/register')
        .send({ ...validUser, password: 'weak' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate email registration', async () => {
      const response = await request
        .post('/api/auth/register')
        .send(validUser)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Email already registered');
    });
  });
});