/**
 * Unit tests for the API error handling middleware.
 *
 * These tests focus on the two special error types that must result in a
 * **415 Unsupported Media Type** response:
 *   - charset.unsupported
 *   - encoding.unsupported
 *
 * A generic unexpected error is also exercised to ensure the fallback 500
 * behaviour remains unchanged.
 */

const errorHandler = require('../../../src/middleware/errorHandler');

describe('errorHandler middleware', () => {
  // Helper to create a mock `res` object with jest spies.
  const createResMock = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('returns 415 for charset.unsupported errors', () => {
    const err = { type: 'charset.unsupported', message: 'unsupported charset' };
    const req = {};
    const res = createResMock();

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(415);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unsupported media type' });
  });

  test('returns 415 for encoding.unsupported errors', () => {
    const err = { type: 'encoding.unsupported', message: 'unsupported encoding' };
    const req = {};
    const res = createResMock();

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(415);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unsupported media type' });
  });

  test('preserves explicit client error status (e.g., 400)', () => {
    const err = { status: 400, message: 'Bad request example' };
    const req = {};
    const res = createResMock();

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Bad request example' });
  });

  test('fallback to 500 for unexpected errors', () => {
    const err = new Error('Something went wrong');
    const req = {};
    const res = createResMock();

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unexpected server error' });
  });
});
