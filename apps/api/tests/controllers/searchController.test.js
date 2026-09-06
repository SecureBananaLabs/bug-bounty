const { search } = require('../../src/controllers/searchController');
const searchService = require('../../src/services/searchService');

jest.mock('../../src/services/searchService');

describe('searchController.search', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {}
    };
    res = {
      json: jest.fn()
    };
    next = jest.fn();
    searchService.search.mockReset();
  });

  it('should return empty results when query is missing', async () => {
    await search(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ results: [] });
    expect(searchService.search).not.toHaveBeenCalled();
  });

  it('should return empty results when query is empty string', async () => {
    req.query.q = '';
    await search(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ results: [] });
    expect(searchService.search).not.toHaveBeenCalled();
  });

  it('should return empty results when query is only whitespace', async () => {
    req.query.q = '   ';
    await search(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ results: [] });
    expect(searchService.search).not.toHaveBeenCalled();
  });

  it('should trim whitespace from query before searching', async () => {
    req.query.q = '  hello world  ';
    searchService.search.mockResolvedValue(['result1']);
    await search(req, res, next);
    expect(searchService.search).toHaveBeenCalledWith('hello world');
    expect(res.json).toHaveBeenCalledWith({ results: ['result1'] });
  });

  it('should reject non-string query values', async () => {
    req.query.q = ['array', 'value'];
    await search(req, res, next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid search query: must be a string',
        status: 400
      })
    );
    expect(searchService.search).not.toHaveBeenCalled();
  });

  it('should reject queries longer than 200 characters', async () => {
    req.query.q = 'a'.repeat(201);
    await search(req, res, next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Search query must be 200 characters or less',
        status: 400
      })
    );
    expect(searchService.search).not.toHaveBeenCalled();
  });

  it('should accept queries exactly 200 characters', async () => {
    req.query.q = 'a'.repeat(200);
    searchService.search.mockResolvedValue(['result']);
    await search(req, res, next);
    expect(searchService.search).toHaveBeenCalledWith('a'.repeat(200));
    expect(res.json).toHaveBeenCalledWith({ results: ['result'] });
  });

  it('should call searchService.search with trimmed query', async () => {
    req.query.q = 'developer';
    searchService.search.mockResolvedValue(['job1', 'job2']);
    await search(req, res, next);
    expect(searchService.search).toHaveBeenCalledWith('developer');
    expect(res.json).toHaveBeenCalledWith({ results: ['job1', 'job2'] });
  });

  it('should call next with error when searchService throws', async () => {
    req.query.q = 'test';
    const error = new Error('Service error');
    searchService.search.mockRejectedValue(error);
    await search(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});
