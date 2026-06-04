const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Auth API - Registration', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should reject registration without fullName', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        role: 'FREELANCER'
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].msg).toContain('Full name is required');
  });

  it('should reject registration with empty fullName', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        fullName: '',
        role: 'FREELANCER'
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].msg).toContain('Full name is required');
  });

  it('should reject registration with whitespace-only fullName', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        fullName: '   ',
        role: 'FREELANCER'
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].msg).toContain('Full name is required');
  });

  it('should accept registration with valid fullName', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
        role: 'FREELANCER'
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.fullName).toBe('John Doe');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.role).toBe('FREELANCER');
  });

  it('should preserve fullName in returned user payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'jane@example.com',
        password: 'securepass',
        fullName: 'Jane Smith',
        role: 'CLIENT'
      });

    expect(res.status).toBe(201);
    expect(res.body.user.fullName).toBe('Jane Smith');

    // Verify the user exists in database with fullName
    const user = await prisma.user.findUnique({
      where: { email: 'jane@example.com' },
      select: { fullName: true }
    });
    expect(user.fullName).toBe('Jane Smith');
  });
});
