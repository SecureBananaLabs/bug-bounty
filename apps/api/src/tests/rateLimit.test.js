import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function login(base) {
  return fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "brute@example.com", password: "guess-guess" })
  });
}

// express-rate-limit v7 keeps its counters in a module-level store keyed by
// IP, so every attempt in this process shares one budget. These assertions
// therefore run as a single ordered test: splitting them would make each one
// inherit the previous one's exhausted window and assert nothing real.
//
// The limiter instance is a middleware function and does not expose its
// configured `limit`, so the budget is asserted through observable behaviour
// rather than by reaching into library internals.
test("the auth limiter throttles login with a JSON 429 well before the general budget", async () => {
  await withServer(async (base) => {
    const codes = [];
    let limitedBody = null;

    for (let i = 0; i < 40; i += 1) {
      const res = await login(base);
      codes.push(res.status);
      if (res.status === 429 && limitedBody === null) {
        limitedBody = await res.json();
      }
    }

    const firstThrottled = codes.indexOf(429);

    // 1. Login is throttled at all.
    assert.ok(firstThrottled !== -1, `login was never throttled: ${[...new Set(codes)]}`);

    // 2. It engages at the configured strict budget (~20), not the general
    //    limiter's 200. If it only engaged past 40 the strict limiter would
    //    not actually be in effect on the auth routes.
    assert.ok(
      firstThrottled <= 25,
      `throttled only after ${firstThrottled} attempts; expected around 20`
    );

    // 3. The 429 is a JSON error body, not an HTML crash page.
    assert.equal(limitedBody.success, false);
    assert.match(limitedBody.message, /too many authentication attempts/i);

    // 4. Every remaining attempt in the window stays throttled.
    assert.equal(codes[firstThrottled], 429);
    assert.ok(
      codes.slice(firstThrottled).every((code) => code === 429),
      "the window must stay closed once the limit is hit"
    );
  });
});
