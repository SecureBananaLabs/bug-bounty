const request = require('supertest');
const express = require('express');
const { validateCreateUser } = require('./user');

const app = express();
app.use(express.json());
app.post('/test', validateCreateUser, (req, res) => {
  res.status(201).json({ message: 'User created' });
});

describe('validateCreateUser', () => {
  describe('email validation', () => {
    test('should reject missing email', async () => {
      const res = await request(app)
        .post('/test')
        .send({ password: 'password123', name: 'John' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ msg: 'Valid email is required' })
      ]));
    });

    test('should reject empty email', async () => {
      const res = await request(app)
        .post('/test')
        .send({ email: '', password: 'password123', name: 'John' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ msg: 'Valid email is required' })
      ]));
    });

    test('should reject email with only @', async () => {
      const res = await request(app)
        .post('/test')
        .send({ email: 'user@', password: 'password123', name: 'John' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ msg: 'Valid email is required' })
      ]));
    });

    test('should reject email without TLD', async () => {
      const res = await request(app)
        .post('/test')
        .send({ email: 'user@domain', password: 'password123', name: 'John' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ msg: 'Valid email is required' })
      ]));
    });

    test('should reject email without @', async () => {
      const res = await request(app)
        .post('/test')
        .send({ email: 'userdomain.com', password: 'password123', name: 'John' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ msg: 'Valid email is required' })
      ]));
    });

    test('should reject email with spaces', async () => {
      const res = await request(app)
        .post('/test')
        .send({ email: 'user @domain.com', password: 'password123', name: 'John' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ msg: 'Valid email is required' })
      ]));
    });

    test('should accept valid email formats', async () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@sub.domain.org',
        'a@b.co',
        'user_name@example-domain.com',
        'user.name+tag@sub.example.com',
      ];

      for (const email of validEmails) {
        const res = await request(app)
          .post('/test')
          .send({ email, password: 'password123', name: 'John' });
        expect(res.status).toBe(201);
      }
    });

    test('should reject invalid email formats', async () => {
      const invalidEmails = [
        'user@',
        'user@domain',
        '@domain.com',
        'user@.com',
        'user@domain.',
        'user..name@domain.com',
        'user@domain..com',
        'user@-domain.com',
        'user@domain-.com',
        'user name@domain.com',
        'user@domain.com ', // trailing space
        ' user@domain.com', // leading space
      ];

      for (const email of invalidEmails) {
        const res = await request(app)
          .post('/test')
          .send({ email, password: 'password123', name: 'John' });
        expect(res.status).toBe(400);
        expect(res.body.errors).toEqual(expect.arrayContaining([
          expect.objectContaining({ msg: 'Valid email is required' })
        ]));
      }
    });
  });

  describe('password validation', () => {
    test('should reject missing password', async () => {
      const res = await request(app)
        .post('/test')
        .send({ email: 'user@example.com', name: 'John' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ msg: 'Password is required' })
      ]));
    });

    test('should reject password shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/test')
        .send({ email: 'user@example.com', password: 'short', name: 'John' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ msg: 'Password must be at least 8 characters' })
      ]));
    });

    test('should accept password of 8 or more characters', async () => {
      const res = await request(app)
        .post('/test')
        .send({ email: 'user@example.com', password: 'password123', name: 'John' });
      expect(res.status).toBe(201);
    });
  });

  describe('name validation', () => {
    test('should accept valid name', async () => {
      const res = await request(app)
        .post('/test')
        .send({ email: 'user@example.com', password: 'password123', name: 'John Doe' });
      expect(res.status).toBe(201);
    });

    test('should reject name longer than 100 characters', async () => {
      const longName = 'a'.repeat(101);
      const res = await request(app)
        .post('/test')
        .send({ email: 'user@example.com', password: 'password123', name: longName });
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ msg: 'Name must be at most 100 characters' })
      ]));
    });

    test('should accept missing name (optional)', async () => {
      const res = await request(app)
        .post('/test')
        .send({ email: 'user@example.com', password: 'password123' });
      expect(res.status).toBe(201);
    });
  });
});
