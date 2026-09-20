import test from "node:test";
import assert from "node:assert/strict";
import { createCorsOptions } from "../app.js";

test("CORS disables wildcard origins unless CORS_ORIGINS is configured", () => {
  const previous = process.env.CORS_ORIGINS;
  delete process.env.CORS_ORIGINS;

  assert.deepEqual(createCorsOptions(), { origin: false });

  process.env.CORS_ORIGINS = "https://app.example.com, https://admin.example.com ";
  assert.deepEqual(createCorsOptions(), {
    origin: ["https://app.example.com", "https://admin.example.com"]
  });

  if (previous === undefined) {
    delete process.env.CORS_ORIGINS;
  } else {
    process.env.CORS_ORIGINS = previous;
  }
});
