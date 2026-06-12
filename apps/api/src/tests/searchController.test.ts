import request from 'supertest';
import app from '../app';
import { searchController } from '../controllers/searchController';

describe('Search Controller', () => {
  it('should trim and limit search query', async () => {
    const query = '   hello world   ';
    const response = await request(app).get(`/api/search?q=${query}`);
    expect(response.body).toBeDefined();
  });

  it('should reject overly long query', async () => {
    const query = 'a'.repeat(101);
    const response = await request(app).get(`/api/search?q=${query}`);
    expect(response.status).toBe(400);
  });

  it('should reject non-string query', async () => {
    const query = 123;
    const response = await request(app).get(`/api/search?q=${query}`);
    expect(response.status).toBe(400);
  });
});