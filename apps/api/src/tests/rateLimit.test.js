import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    return await run(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function postMalformedJson(port) {
  return fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"email": "user@example.com"'
  });
}

function remainingQuota(response) {
  const header = response.headers.get("ratelimit");
  assert.ok(header, "expected a RateLimit header on the response");

  const match = /remaining=(\d+)/.exec(header);
  assert.ok(match, `expected remaining= in RateLimit header, got "${header}"`);
  return Number(match[1]);
}

test("malformed JSON body still consumes rate limit quota", async () => {
  await withServer(async (port) => {
    const first = await postMalformedJson(port);
    const second = await postMalformedJson(port);

    assert.equal(
      remainingQuota(second),
      remainingQuota(first) - 1,
      "malformed JSON requests must decrement the limiter"
    );
  });
});

test("malformed JSON body is rejected with 400", async () => {
  await withServer(async (port) => {
    const response = await postMalformedJson(port);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });
});
