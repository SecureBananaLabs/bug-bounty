import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createApiLimiter } from "../middleware/rateLimit.js";

async function listen(app) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function remaining(response) {
  const match = /remaining=(\d+)/.exec(response.headers.get("ratelimit") ?? "");
  return match ? Number(match[1]) : null;
}

test("each app gets its own limiter instance", () => {
  assert.notEqual(createApiLimiter(), createApiLimiter());
});

test("two apps keep independent request counters", async () => {
  const first = await listen(createApp());
  const second = await listen(createApp());

  const firstUrl = `http://127.0.0.1:${first.address().port}/health`;
  const secondUrl = `http://127.0.0.1:${second.address().port}/health`;

  await fetch(firstUrl);
  const afterFirst = await fetch(firstUrl);
  const afterSecond = await fetch(secondUrl);

  assert.equal(afterFirst.status, 200);
  assert.equal(afterSecond.status, 200);
  assert.equal(remaining(afterFirst), 198);
  assert.equal(remaining(afterSecond), 199);

  await close(first);
  await close(second);
});
