import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

test("Authentication Security & Privilege Escalation Guard", async (t) => {
  let server;
  let baseUrl;

  t.beforeEach(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise((res) => server.once("listening", res));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  t.afterEach(async () => {
    if (server) {
      await new Promise((res) => server.close(res));
    }
  });

  await t.test("POST /api/auth/register rejects role='admin' to prevent privilege escalation", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "attacker@test.com",
        password: "supersecurepassword123",
        role: "admin"
      })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("POST /api/auth/register generates matching user id and token sub claim", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "legit@test.com",
        password: "supersecurepassword123",
        role: "freelancer"
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    const userId = body.data.id;
    const token = body.data.token;
    assert.ok(userId);
    assert.ok(token);

    const decoded = verifyAccessToken(token);
    assert.equal(decoded.sub, userId, "Token sub claim must match returned user id");
    assert.equal(decoded.role, "freelancer");
  });

  await t.test("POST /api/auth/refresh returns 401 when Authorization header is absent", async () => {
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST"
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Unauthorized");
  });

  await t.test("POST /api/auth/refresh preserves caller identity and role in refreshed token", async () => {
    const initialToken = signAccessToken({ sub: "usr_custom99", role: "freelancer" });
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${initialToken}` }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    const refreshedToken = body.data.token;
    assert.ok(refreshedToken);

    const decoded = verifyAccessToken(refreshedToken);
    assert.equal(decoded.sub, "usr_custom99");
    assert.equal(decoded.role, "freelancer");
  });
});
