const errorHandler = require('../../src/middleware/errorHandler');

// Mock console.error to capture logs
let consoleErrorSpy;

beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe('errorHandler middleware', () => {
  const mockReq = (env) => ({
    method: 'GET',
    originalUrl: '/api/test',
    url: '/api/test',
    app: { get: () => env },
  });

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn();

  test('should log minimal metadata in production environment', () => {
    // Temporarily set NODE_ENV to production
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const err = new Error('Sensitive error message with secret=abc123');
    const req = mockReq('production');
    const res = mockRes();

    errorHandler(err, req, res, mockNext);

    // Verify console.error was called with an object containing only metadata
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const logArg = consoleErrorSpy.mock.calls[0][1];
    expect(logArg).toHaveProperty('method', 'GET');
    expect(logArg).toHaveProperty('url', '/api/test');
    expect(logArg).toHaveProperty('statusCode', 500);
    expect(logArg).toHaveProperty('timestamp');
    // Ensure raw error details are NOT present
    expect(logArg).not.toHaveProperty('message');
    expect(logArg).not.toHaveProperty('stack');
    expect(logArg).not.toHaveProperty('name');

    // Verify response is generic 500
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });

    // Restore original env
    process.env.NODE_ENV = originalEnv;
  });

  test('should log full error in non-production environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const err = new Error('Debug error');
    err.statusCode = 400;
    const req = mockReq('development');
    const res = mockRes();

    errorHandler(err, req, res, mockNext);

    // Verify console.error was called with the raw error
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][1]).toBe(err);

    // Verify response uses the error's statusCode
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });

    process.env.NODE_ENV = originalEnv;
  });

  test('should default to 500 if no statusCode on error', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const err = new Error('No status');
    const req = mockReq('development');
    const res = mockRes();

    errorHandler(err, req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);

    process.env.NODE_ENV = originalEnv;
  });

  test('should not expose error details in production response', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const err = new Error('Secret: password=123');
    const req = mockReq('production');
    const res = mockRes();

    errorHandler(err, req, res, mockNext);

    // Response must not contain error details
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('message');
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('stack');

    process.env.NODE_ENV = originalEnv;
  });
});
