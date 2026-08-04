import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("rate limiter runs before JSON body parser - malformed JSON still rate limited", async () => {
  const app = createApp();
  const mockReq = { method: "POST", url: "/api/test", headers: { "content-type": "application/json" }, body: {} };
  const mockRes = { statusCode: 200, setHeader: () => {}, json: () => {}, end: () => {} };
  const next = () => {};

  // First request with malformed JSON should be counted by rate limiter
  // (can't fully test rate limit without hitting the limit, but we verify order)
  const middlewareStack = app._router.stack.map(l => l.handle.name || l.handle.toString().slice(0,50));
  const limiterIdx = middlewareStack.findIndex(m => m.includes("apiLimiter") || m.includes("rateLimit"));
  const parserIdx = middlewareStack.findIndex(m => m.includes("json") || m.includes("bodyParser"));
  
  assert.ok(limiterIdx >= 0, "rate limiter middleware present");
  assert.ok(parserIdx >= 0, "JSON parser middleware present");
  assert.ok(limiterIdx < parserIdx, "rate limiter must be before JSON parser");
});