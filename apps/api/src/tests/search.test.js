import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

let server, port;

function startServer() {
  const app = createApp();
  server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => {
      port = server.address().port;
      resolve();
    });
    server.once("error", reject);
  });
}

function stopServer() {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

function url(path) {
  return `http://127.0.0.1:${port}${path}`;
}

// ─── Test: valid short query succeeds ────────────────────────────────
test("GET /api/search with valid query returns 200", async () => {
  await startServer();
  try {
    const res = await fetch(url("/api/search?q=hello"));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.query, "hello");
  } finally {
    await stopServer();
  }
});

// ─── Test: empty/missing query defaults to empty string ──────────────
test("GET /api/search without q param returns 200 with empty query", async () => {
  await startServer();
  try {
    const res = await fetch(url("/api/search"));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.query, "");
  } finally {
    await stopServer();
  }
});

// ─── Test: query exceeding 200 chars is rejected ─────────────────────
test("GET /api/search rejects query longer than 200 characters", async () => {
  await startServer();
  try {
    const longQuery = "a".repeat(201);
    const res = await fetch(url(`/api/search?q=${longQuery}`));
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.message.toLowerCase().includes("200"));
  } finally {
    await stopServer();
  }
});

// ─── Test: regex special characters are rejected ─────────────────────
test("GET /api/search rejects query with regex special characters", async () => {
  await startServer();
  try {
    // These regex metacharacters enable ReDoS and are blocked
    const dangerousChars = ["*", "+", "{", "}", "(", ")", "[", "]", "|", "^", "$", "\\"];
    for (const ch of dangerousChars) {
      const encoded = encodeURIComponent(ch);
      const res = await fetch(url(`/api/search?q=test${encoded}query`));
      assert.equal(res.status, 400, `Expected 400 for character '${ch}'`);
      const body = await res.json();
      assert.equal(body.success, false);
    }
  } finally {
    await stopServer();
  }
});

// ─── Test: allowed special characters are accepted ───────────────────
test("GET /api/search accepts query with allowed punctuation", async () => {
  await startServer();
  try {
    const allowedQueries = [
      "hello world",
      "test-query",
      "user_name",
      "email@example.com",
      "price:100",
      "it's great!",
      "what?",
      "say \"hi\""
    ];
    for (const q of allowedQueries) {
      const encoded = encodeURIComponent(q);
      const res = await fetch(url(`/api/search?q=${encoded}`));
      assert.equal(res.status, 200, `Expected 200 for query '${q}'`);
      const body = await res.json();
      assert.equal(body.success, true);
    }
  } finally {
    await stopServer();
  }
});

// ─── Test: sanitizeSearchQuery strips regex characters ───────────────
test("sanitizeSearchQuery strips dangerous regex characters", async () => {
  const { sanitizeSearchQuery } = await import("../validators/search.js");
  assert.equal(sanitizeSearchQuery("test*query"), "testquery");
  assert.equal(sanitizeSearchQuery("a+b"), "ab");
  assert.equal(sanitizeSearchQuery("^start$"), "start");
  // {1} → "1" (braces stripped, inner content remains)
  assert.equal(sanitizeSearchQuery("a{1}b"), "a1b");
  assert.equal(sanitizeSearchQuery("normal text"), "normal text");
  assert.equal(sanitizeSearchQuery(""), "");
  assert.equal(sanitizeSearchQuery(null), "");
});

// ─── Test: rate limiting on search endpoint ──────────────────────────
test("search endpoint rate limits after 20 requests", async () => {
  await startServer();
  try {
    // Fire 20 requests rapidly — should all succeed
    for (let i = 0; i < 20; i++) {
      const res = await fetch(url("/api/search?q=ratetest"));
      assert.equal(res.status, 200, `Request ${i + 1} should succeed`);
    }
    // 21st should be rate limited
    const res = await fetch(url("/api/search?q=ratetest"));
    assert.equal(res.status, 429, "21st request should be rate limited");
    const body = await res.json();
    assert.equal(body.success, false);
  } finally {
    await stopServer();
  }
});
