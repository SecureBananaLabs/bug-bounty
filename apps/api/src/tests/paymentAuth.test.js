const request = require('supertest');
const express = require('express');
const paymentRoutes = require('../routes/paymentRoutes');

const app = express();
app.use(express.json());
app.use('/api/payments', paymentRoutes);

describe('POST /api/payments Authentication Middleware', () => {
    it('should reject anonymous requests with 401 Unauthorized', async () => {
        const response = await request(app)
            .post('/api/payments')
            .send({ amount: 1000, currency: 'usd' });
        
        expect(response.status).toBe(401);
    });
});
