import { describe, it, mock } from "node:test";
import assert from "node:assert";
import { errorHandler } from "../middleware/errorHandler.js";

describe("errorHandler middleware", () => {
  it("returns 500 JSON when headers have NOT been sent", () => {
    const err = new Error("test error");
    const req = {};
    const res = {
      headersSent: false,
      status: mock.fn(() => res),
      json: mock.fn()
    };
    const next = mock.fn();

    errorHandler(err, req, res, next);

    assert.strictEqual(res.status.mock.callCount(), 1);
    assert.strictEqual(res.status.mock.calls[0].arguments[0], 500);
    assert.strictEqual(res.json.mock.callCount(), 1);
    assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
      success: false,
      message: "Unexpected server error"
    });
    assert.strictEqual(next.mock.callCount(), 0);
  });

  it("calls next(err) without writing response when headers already sent", () => {
    const err = new Error("post-commit error");
    const req = {};
    const res = {
      headersSent: true,
      status: mock.fn(() => res),
      json: mock.fn()
    };
    const next = mock.fn();

    errorHandler(err, req, res, next);

    // next() must be called 鈥?NOT res.status() or res.json()
    assert.strictEqual(next.mock.callCount(), 1);
    assert.deepStrictEqual(next.mock.calls[0].arguments[0], err);
    assert.strictEqual(res.status.mock.callCount(), 0);
    assert.strictEqual(res.json.mock.callCount(), 0);
  });

  // Edge cases
  it("should handle null error", () => {
    const err = null;
    const req = {};
    const res = {
      headersSent: false,
      status: mock.fn(() => res),
      json: mock.fn()
    };
    const next = mock.fn();

    assert.doesNotThrow(() => errorHandler(err, req, res, next));
    assert.strictEqual(res.status.mock.callCount(), 1);
    assert.strictEqual(res.json.mock.callCount(), 1);
  });

  it("should handle undefined error", () => {
    const err = undefined;
    const req = {};
    const res = {
      headersSent: false,
      status: mock.fn(() => res),
      json: mock.fn()
    };
    const next = mock.fn();

    assert.doesNotThrow(() => errorHandler(err, req, res, next));
    assert.strictEqual(res.status.mock.callCount(), 1);
    assert.strictEqual(res.json.mock.callCount(), 1);
  });

  it("should handle error with empty message", () => {
    const err = new Error("");
    const req = {};
    const res = {
      headersSent: false,
      status: mock.fn(() => res),
      json: mock.fn()
    };
    const next = mock.fn();

    assert.doesNotThrow(() => errorHandler(err, req, res, next));
    assert.strictEqual(res.status.mock.callCount(), 1);
    assert.strictEqual(res.json.mock.callCount(), 1);
  });

  it("should call console.error when error is provided", () => {
    const err = new Error("test error");
    const req = {};
    const res = {
      headersSent: false,
      status: mock.fn(() => res),
      json: mock.fn()
    };
    const next = mock.fn();

    // Mock console.error
    const originalConsoleError = console.error;
    let consoleErrorCalled = false;
    console.error = () => { consoleErrorCalled = true; };

    errorHandler(err, req, res, next);

    assert.strictEqual(consoleErrorCalled, true);
    console.error = originalConsoleError; // Restore
  });

  it("should use strict equality for error object reference", () => {
    const err = new Error("strict test");
    const req = {};
    const res = {
      headersSent: true,
      status: mock.fn(() => res),
      json: mock.fn()
    };
    const next = mock.fn();

    errorHandler(err, req, res, next);

    // next() must receive the EXACT SAME error object (strict equality)
    assert.strictEqual(next.mock.calls[0].arguments[0], err);
  });
});