const request = require('supertest');
const app = require('../../app');
const { generateToken } = require('../helpers/auth');

describe('POST /api/payments', () => {
    it('should return 401 if no token provided', async () => {
        const res = await request(app)
            .post('/api/payments')
            .send({ amount: 1000, currency: 'usd' });
        expect(res.status).toBe(401);
    });

    it('should return 201 with valid token', async () => {
        const token = generateToken({ id: 'user123' });
        const res = await request(app)
            .post('/api/payments')
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 1000, currency: 'usd' });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
    });

    it('should return 401 with invalid token', async () => {
        const res = await request(app)
            .post('/api/payments')
            .set('Authorization', 'Bearer invalidtoken')
            .send({ amount: 1000, currency: 'usd' });
        expect(res.status).toBe(401);
    });
});