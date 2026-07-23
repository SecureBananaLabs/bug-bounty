import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { apiLimiter } from "../middleware/rateLimit.js";

test("rate limiter is registered before JSON body parser", async (t) => {
  const app = createApp();
  const layers = app._router.stack;
  
  const rateLimitIdx = layers.findIndex(layer => layer.handle === apiLimiter);
  const jsonParserIdx = layers.findIndex(layer => layer.name === "jsonParser");

  assert.notEqual(rateLimitIdx, -1, "rateLimit middleware should be registered");
  assert.notEqual(jsonParserIdx, -1, "jsonParser middleware should be registered");
  assert.ok(rateLimitIdx < jsonParserIdx, "rateLimit should execute before jsonParser");
});
