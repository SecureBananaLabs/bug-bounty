import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { errorHandler } from "./errorHandler.js";

function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

describe("Rate Limiter & Malformed JSON Handling (#11677)", () => {
  it("converts JSON body parse SyntaxError to clean 400 Bad Request", () => {
    const err = new SyntaxError("Unexpected token in JSON at position 5");
    err.status = 400;
    err.body = '{"bad:json';

    const req = {};
    const res = mockRes();
    let nextCalled = false;

    errorHandler(err, req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Invalid JSON payload");
    assert.equal(nextCalled, false);
  });

  it("handles generic unexpected errors as 500", () => {
    const err = new Error("Database connection lost");
    const req = {};
    const res = mockRes();

    errorHandler(err, req, res, () => {});

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Unexpected server error");
  });
});
