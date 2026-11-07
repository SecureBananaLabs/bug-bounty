import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET ??= "test-secret";

const { createApp } = await import("../app.js");
const { signAccessToken } = await import("../utils/jwt.js");

// Regression test for #2776: POST /api/reviews accepted anonymous writes.
// Creation is account-scoped, so the POST route now requires the bearer-token
// authMiddleware while the GET route stays public.

const token = signAccessToken({ sub: "usr_tester", role: "client" });

let base;
let server;

test.before(async () => {
  await new Promise((resolve) => {
    server = createApp().listen(0, "127.0.0.1", () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(() => new Promise((resolve) => server.close(resolve)));

async function request(method, path, headers = {}, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

const [path, payload] = ["/api/reviews", { rating: 5, comment: "ok" }];

test("POST /api/reviews rejects requests without a bearer token", async () => {
  const res = await request("POST", path, {}, payload);
  assert.equal(res.status, 401);
  assert.equal(res.json.success, false);
});

test("POST /api/reviews rejects an invalid token", async () => {
  const res = await request(
    "POST",
    path,
    { authorization: "Bearer not-a-jwt" },
    payload
  );
  assert.equal(res.status, 401);
});

test("POST /api/reviews accepts a valid bearer token", async () => {
  const res = await request(
    "POST",
    path,
    { authorization: `Bearer ${token}`, "content-type": "application/json" },
    payload
  );
  assert.equal(res.status, 201);
  assert.equal(res.json.success, true);
});

test("GET /api/reviews stays public", async () => {
  const res = await request("GET", path);
  assert.equal(res.status, 200);
});
