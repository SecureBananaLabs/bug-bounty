import test from 'node:test';
import assert from 'node:assert';
import { errorHandler } from '../middleware/errorHandler.js';

test('errorHandler returns 500 for unexpected errors', () => {
  const err = new Error('Something went wrong');
  const req = {};
  const res = {
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  
  errorHandler(err, req, res, () => {});
  
  assert.strictEqual(res.statusCode, 500);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, 'Unexpected server error');
});

test('errorHandler returns 400 for malformed JSON', () => {
  const err = new Error('Unexpected token');
  err.type = 'entity.parse.failed';
  const req = {};
  const res = {
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  
  errorHandler(err, req, res, () => {});
  
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, 'Malformed JSON');
});

test('errorHandler returns 413 for oversized JSON bodies', () => {
  const err = new Error('request entity too large');
  err.type = 'entity.too.large';
  const req = {};
  const res = {
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  
  errorHandler(err, req, res, () => {});
  
  assert.strictEqual(res.statusCode, 413);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, 'Payload Too Large');
});

test('errorHandler calls next if headers already sent', () => {
  const err = new Error('Late error');
  const req = {};
  const res = { headersSent: true };
  let nextCalled = false;
  let nextArg = null;
  
  errorHandler(err, req, res, (e) => {
    nextCalled = true;
    nextArg = e;
  });
  
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(nextArg, err);
});
