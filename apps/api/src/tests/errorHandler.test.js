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

    // next() must be called — NOT res.status() or res.json()
    assert.strictEqual(next.mock.callCount(), 1);
    assert.deepStrictEqual(next.mock.calls[0].arguments[0], err);
    assert.strictEqual(res.status.mock.callCount(), 0);
    assert.strictEqual(res.json.mock.callCount(), 0);
  });

  it("handles null error without crashing", () => {
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
    assert.strictEqual(next.mock.callCount(), 0);
  });

  it("handles undefined error without crashing", () => {
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
    assert.strictEqual(next.mock.callCount(), 0);
  });

  it("handles error with empty message", () => {
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
    assert.deepStrictEqual(res.json.mock.calls[0].arguments[0], {
      success: false,
      message: "Unexpected server error"
    });
    assert.strictEqual(next.mock.callCount(), 0);
  });

  it("calls console.error with the error object", () => {
    const err = new Error("test error for console");
    const req = {};
    const res = {
      headersSent: false,
      status: mock.fn(() => res),
      json: mock.fn()
    };
    const next = mock.fn();

    const consoleErrorMock = mock.method(console, "error", () => {});

    errorHandler(err, req, res, next);

    assert.strictEqual(consoleErrorMock.mock.callCount(), 1);
    assert.strictEqual(consoleErrorMock.mock.calls[0].arguments[0], "Unhandled API error:");
    assert.strictEqual(consoleErrorMock.mock.calls[0].arguments[1], err);

    consoleErrorMock.mock.restore();
  });

  it("passes the exact same error object to next()", () => {
    const err = new Error("exact same error test");
    const req = {};
    const res = {
      headersSent: true,
      status: mock.fn(() => res),
      json: mock.fn()
    };
    const next = mock.fn();

    errorHandler(err, req, res, next);

    assert.strictEqual(next.mock.callCount(), 1);
    assert.strictEqual(next.mock.calls[0].arguments[0], err); // strict equality
  });
});
