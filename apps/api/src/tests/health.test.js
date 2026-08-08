import test from "node:test";
import assert from "node:assert/strict";
import rateLimit from "express-rate-limit";
import { createApp } from "../app.js";

async function withServer(app, callback) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /health returns ok payload", async () => {
  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { ok: true, service: "api" });
  });
});

test("malformed JSON requests count toward the API rate limit", async () => {
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 2,
    standardHeaders: "draft-7",
    legacyHeaders: false
  });

  await withServer(createApp({ limiter }), async (baseUrl) => {
    const sendMalformedJson = () =>
      fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{"
      });

    const first = await sendMalformedJson();
    assert.equal(first.status, 400);
    assert.deepEqual(await first.json(), {
      success: false,
      message: "Malformed JSON payload"
    });

    const second = await sendMalformedJson();
    assert.equal(second.status, 400);

    const third = await sendMalformedJson();
    assert.equal(third.status, 429);
  });
});
