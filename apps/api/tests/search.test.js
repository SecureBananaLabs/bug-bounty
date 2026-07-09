const request = require('supertest');
const app = require('../src/app');

// Mock searchService to avoid DB dependency
jest.mock('../src/services/searchService', () => ({
  globalSearch: jest.fn((query) => Promise.resolve({ results: [], query }))
}));

const searchService = require('../src/services/searchService');

describe('GET /api/search', () => {
  beforeEach(() => {
    searchService.globalSearch.mockClear();
  });

  it('should return 200 and results for a valid query', async () => {
    const res = await request(app).get('/api/search?q=hello');
    expect(res.status).toBe(200);
    expect(res.body.query).toBe('hello');
    expect(searchService.globalSearch).toHaveBeenCalledWith('hello');
  });

  it('should trim whitespace from query', async () => {
    const res = await request(app).get('/api/search?q=  hello world  ');
    expect(res.status).toBe(200);
    expect(res.body.query).toBe('hello world');
    expect(searchService.globalSearch).toHaveBeenCalledWith('hello world');
  });

  it('should return 200 and empty results when query is missing', async () => {
    const res = await request(app).get('/api/search');
    expect(res.status).toBe(200);
    expect(res.body.query).toBe('');
    expect(searchService.globalSearch).toHaveBeenCalledWith('');
  });

  it('should return 200 and empty results when query is empty string', async () => {
    const res = await request(app).get('/api/search?q=');
    expect(res.status).toBe(200);
    expect(res.body.query).toBe('');
    expect(searchService.globalSearch).toHaveBeenCalledWith('');
  });

  it('should return 200 and empty results when query is only whitespace', async () => {
    const res = await request(app).get('/api/search?q=   ');
    expect(res.status).toBe(200);
    expect(res.body.query).toBe('');
    expect(searchService.globalSearch).toHaveBeenCalledWith('');
  });

  it('should return 400 for repeated query parameters', async () => {
    const res = await request(app).get('/api/search?q=first&q=second');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(searchService.globalSearch).not.toHaveBeenCalled();
  });

  it('should return 400 for non-string query parameter (array)', async () => {
    const res = await request(app).get('/api/search?q[]=a&q[]=b');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(searchService.globalSearch).not.toHaveBeenCalled();
  });

  it('should return 400 for over-long query', async () => {
    const longQuery = 'a'.repeat(201);
    const res = await request(app).get(`/api/search?q=${longQuery}`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(searchService.globalSearch).not.toHaveBeenCalled();
  });

  it('should accept query exactly at max length', async () => {
    const maxQuery = 'a'.repeat(200);
    const res = await request(app).get(`/api/search?q=${maxQuery}`);
    expect(res.status).toBe(200);
    expect(res.body.query).toBe(maxQuery);
    expect(searchService.globalSearch).toHaveBeenCalledWith(maxQuery);
  });
});
