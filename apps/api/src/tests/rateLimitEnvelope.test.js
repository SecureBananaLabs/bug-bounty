import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { apiLimiter, RATE_LIMIT_MESSAGE, rateLimitHandler } from "../middleware/rateLimit.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    if (typeof apiLimiter.resetKey === "function") {
      apiLimiter.resetKey("127.0.0.1");
      apiLimiter.resetKey("::ffff:127.0.0.1");
      apiLimiter.resetKey("::1");
    }
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("RATE_LIMIT_MESSAGE exports shared JSON error envelope", () => {
  assert.deepEqual(RATE_LIMIT_MESSAGE, {
    success: false,
    message: "Too many requests"
  });
});

test("rateLimitHandler formats fallback and custom options into JSON failure envelope", () => {
  const calls = [];
  const mockRes = {
    status(code) {
      calls.push({ status: code });
      return {
        json(payload) {
          calls.push({ json: payload });
          return payload;
        }
      };
    }
  };

  rateLimitHandler({}, mockRes, () => {}, undefined);
  assert.deepEqual(calls, [
    { status: 429 },
    { json: { success: false, message: "Too many requests" } }
  ]);
});

test("apiLimiter allows first 200 requests and rejects 201st request with HTTP 429 JSON envelope", async () => {
  await withServer(async (baseUrl) => {
    for (let i = 1; i <= 200; i++) {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200, `Expected request ${i} to succeed with 200`);
    }

    const blocked = await fetch(`${baseUrl}/health`);
    assert.equal(blocked.status, 429);
    const contentType = blocked.headers.get("content-type") ?? "";
    assert.ok(
      contentType.includes("application/json"),
      `Expected application/json content-type, got: ${contentType}`
    );
    assert.ok(
      blocked.headers.get("ratelimit") || blocked.headers.get("ratelimit-policy"),
      "Expected draft-7 RateLimit headers to be present"
    );
    assert.equal(blocked.headers.get("x-ratelimit-limit"), null);

    const body = await blocked.json();
    assert.deepEqual(body, {
      success: false,
      message: "Too many requests"
    });
  });
});
