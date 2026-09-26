import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { asyncHandler } from "../utils/asyncHandler.js";

describe("asyncHandler", () => {
  it("passes resolved values through normally", async () => {
    let called = false;
    const handler = asyncHandler(async (req, res) => {
      called = true;
      res.status(200).json({ ok: true });
    });
    const req = {};
    const res = { status: (c) => ({ json: (d) => d }), header: () => {} };
    const next = () => {};
    await handler(req, res, next);
    assert.equal(called, true);
  });

  it("catches Error instances and delegates to next", async () => {
    let nextError = null;
    const handler = asyncHandler(async () => {
      throw new Error("test error");
    });
    const next = (err) => { nextError = err; };
    await handler({}, {}, next);
    assert.ok(nextError instanceof Error);
    assert.equal(nextError.message, "test error");
  });

  it("coerces null into Error with descriptive message", async () => {
    let nextError = null;
    const handler = asyncHandler(async () => {
      throw null;
    });
    const next = (err) => { nextError = err; };
    await handler({}, {}, next);
    assert.ok(nextError instanceof Error);
    assert.equal(nextError.message, "Unknown async error");
  });

  it("coerces undefined into Error", async () => {
    let nextError = null;
    const handler = asyncHandler(async () => {
      throw undefined;
    });
    const next = (err) => { nextError = err; };
    await handler({}, {}, next);
    assert.ok(nextError instanceof Error);
  });

  it("coerces string throws into Error with that message", async () => {
    let nextError = null;
    const handler = asyncHandler(async () => {
      throw "something went wrong";
    });
    const next = (err) => { nextError = err; };
    await handler({}, {}, next);
    assert.ok(nextError instanceof Error);
    assert.equal(nextError.message, "something went wrong");
  });

  it("coerces number throws into Error", async () => {
    let nextError = null;
    const handler = asyncHandler(async () => {
      throw 42;
    });
    const next = (err) => { nextError = err; };
    await handler({}, {}, next);
    assert.ok(nextError instanceof Error);
    assert.equal(nextError.message, "42");
  });

  it("coerces object literals into Error via String()", async () => {
    let nextError = null;
    const handler = asyncHandler(async () => {
      throw { code: "FAIL", detail: "oops" };
    });
    const next = (err) => { nextError = err; };
    await handler({}, {}, next);
    assert.ok(nextError instanceof Error);
    assert.ok(nextError.message.includes("[object Object]") || nextError.message.includes("object"));
  });

  it("preserves stack trace of original Error", async () => {
    let nextError = null;
    const handler = asyncHandler(async () => {
      const err = new Error("stack test");
      err.stack; // ensure it exists
      throw err;
    });
    const next = (err) => { nextError = err; };
    await handler({}, {}, next);
    assert.ok(nextError.stack);
    assert.ok(nextError.stack.includes("stack test"));
  });

  it("works with synchronous throws too", async () => {
    let nextError = null;
    const handler = asyncHandler(() => {
      throw new Error("sync error");
    });
    const next = (err) => { nextError = err; };
    await handler({}, {}, next);
    assert.ok(nextError instanceof Error);
    assert.equal(nextError.message, "sync error");
  });
});
