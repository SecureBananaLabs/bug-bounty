const request = require('supertest');
const app = require('../src/index');

describe('Job Budget Validation', () => {
  // ─── Create endpoint ───────────────────────────────────────────────

  describe('POST /api/jobs', () => {
    test('rejects payload when budgetMax < budgetMin', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({ title: 'Bad range', budgetMin: 100, budgetMax: 50 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('budgetMax must not be less than budgetMin');
    });

    test('accepts payload when budgetMax > budgetMin', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({ title: 'Good range', budgetMin: 50, budgetMax: 100 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.budgetMin).toBe(50);
      expect(res.body.data.budgetMax).toBe(100);
    });

    test('accepts payload when budgetMax === budgetMin', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({ title: 'Equal range', budgetMin: 75, budgetMax: 75 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('accepts payload with only budgetMin (partial)', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({ title: 'Partial min', budgetMin: 50 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('accepts payload with only budgetMax (partial)', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({ title: 'Partial max', budgetMax: 100 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('accepts payload with no budget fields at all', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({ title: 'No budget' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Update endpoint ───────────────────────────────────────────────

  describe('PATCH /api/jobs/:id', () => {
    let jobId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({ title: 'Test job', budgetMin: 10, budgetMax: 20 });
      jobId = res.body.data.id;
    });

    test('rejects update when both bounds are supplied and inverted', async () => {
      const res = await request(app)
        .patch(`/api/jobs/${jobId}`)
        .send({ budgetMin: 100, budgetMax: 50 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('budgetMax must not be less than budgetMin');
    });

    test('accepts update with only budgetMin changed', async () => {
      const res = await request(app)
        .patch(`/api/jobs/${jobId}`)
        .send({ budgetMin: 999 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.budgetMin).toBe(999);
      // budgetMax should be preserved from original job
      expect(res.body.data.budgetMax).toBe(20);
    });

    test('accepts update with only budgetMax changed', async () => {
      const res = await request(app)
        .patch(`/api/jobs/${jobId}`)
        .send({ budgetMax: 500 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.budgetMax).toBe(500);
      // budgetMin should be preserved from original job
      expect(res.body.data.budgetMin).toBe(10);
    });

    test('accepts update with valid non-inverted bounds', async () => {
      const res = await request(app)
        .patch(`/api/jobs/${jobId}`)
        .send({ budgetMin: 30, budgetMax: 40 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.budgetMin).toBe(30);
      expect(res.body.data.budgetMax).toBe(40);
    });
  });
});
