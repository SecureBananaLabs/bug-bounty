--- New file ---

const request = require('supertest');

// Isolate these tests from the database by stubbing the search service.
jest.mock('../services/searchService', () => ({
  globalSearch: jest
    .fn()
    .mockResolvedValue({ jobs: [], users: [], proposals: [] }),
}));

const app = require('../app');

describe('GET /api/search', () => {
  it('returns 200 for a valid, non-empty query', async () => {
    const res = await request(app)
      .get('/api/search')
      .query({ q: 'frontend developer' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 when the q parameter is missing', async () => {
    const res = await request(app).get('/api/search');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when the q parameter is blank/whitespace-only', async () => {
    const res = await request(app).get('/api/search').query({ q: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
