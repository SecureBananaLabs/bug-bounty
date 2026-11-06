import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import rateLimit from "express-rate-limit";

test("Rate limiter returns structured 429 JSON envelope when limit is exceeded", async () => {
  const app = express();
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 2,
    legacyHeaders: false,
    standardHeaders: "draft-7",
    handler: (req, res) => {
      return res.status(429).json({
        success: false,
        message: "Too many requests, please try again later"
      });
    }
  });

  app.use(limiter);
  app.get("/test-limit", (req, res) => res.json({ ok: true }));

  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  try {
    const res1 = await fetch(`http://127.0.0.1:${port}/test-limit`);
    assert.equal(res1.status, 200);

    const res2 = await fetch(`http://127.0.0.1:${port}/test-limit`);
    assert.equal(res2.status, 200);

    const res3 = await fetch(`http://127.0.0.1:${port}/test-limit`);
    assert.equal(res3.status, 429);
    assert.equal(res3.headers.get("content-type")?.includes("application/json"), true);
    const body = await res3.json();
    assert.deepEqual(body, {
      success: false,
      message: "Too many requests, please try again later"
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
