const request = require('supertest');

jest.mock('../services/searchService', () => ({
  globalSearch: jest.fn(),
}));

const app = require('../app');
const searchService = require('../services/searchService');

describe('GET /api/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when the q parameter is missing', async () => {
    const res = await request(app).get('/api/search');

    expect(res.statusCode).toBe(400);
    expect(searchService.globalSearch).not.toHaveBeenCalled();
  });

  it('returns 400 when the q parameter is an empty string', async () => {
    const res = await request(app).get('/api/search?q=');

    expect(res.statusCode).toBe(400);
    expect(searchService.globalSearch).not.toHaveBeenCalled();
  });

  it('returns 400 when the q parameter is only whitespace', async () => {
    const res = await request(app).get('/api/search?q=%20%20%20');

    expect(res.statusCode).toBe(400);
    expect(searchService.globalSearch).not.toHaveBeenCalled();
  });

  it('continues the existing search flow for a non-blank query', async () => {
    searchService.globalSearch.mockResolvedValue({ results: [] });

    const res = await request(app).get('/api/search?q=developer');

    expect(res.statusCode).toBe(200);
    expect(searchService.globalSearch).toHaveBeenCalledTimes(1);
    expect(searchService.globalSearch).toHaveBeenCalledWith('developer');
  });
});
