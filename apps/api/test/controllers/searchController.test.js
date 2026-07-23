const { search } = require('../../src/controllers/searchController');
const { searchService } = require('../../src/services/searchService');
const { validateSearchQuery } = require('../../src/utils/validation');

jest.mock('../../src/services/searchService');
jest.mock('../../src/utils/validation');

describe('searchController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {
        q: 'test query'
      }
    };
    res = {
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should validate and sanitize the search query', async () => {
    validateSearchQuery.mockReturnValue('test query');
    searchService.search.mockResolvedValue([{ id: 1, title: 'Test Result' }]);

    await search(req, res, next);

    expect(validateSearchQuery).toHaveBeenCalledWith('test query');
    expect(searchService.search).toHaveBeenCalledWith('test query');
    expect(res.json).toHaveBeenCalledWith([{ id: 1, title: 'Test Result' }]);
  });

  it('should handle validation errors', async () => {
    validateSearchQuery.mockImplementation(() => {
      throw new Error('Invalid query');
    });

    await search(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should handle search service errors', async () => {
    validateSearchQuery.mockReturnValue('test query');
    searchService.search.mockRejectedValue(new Error('Search failed'));

    await search(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});