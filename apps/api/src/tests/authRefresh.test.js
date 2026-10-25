import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function startServer() {
  return new Promise((resolve, reject) => {
    const app = createApp();
    const server = app.listen(0, () => resolve(server));
    server.once("error", reject);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

function baseUrl(server) {
  return `http://127.0.0.1:${server.address().port}`;
}

test("POST /api/auth/refresh without token returns 401", async () => {
  const server = await startServer();
  try {
    const res = await fetch(`${baseUrl(server)}/api/auth/refresh`, {
      method: "POST",
    });
    const body = await res.json();
    assert.equal(res.status, 401);
    assert.equal(body.success, false);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/auth/refresh with invalid token returns 401", async () => {
  const server = await startServer();
  try {
    const res = await fetch(`${baseUrl(server)}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: "Bearer invalid-token-here" },
    });
    const body = await res.json();
    assert.equal(res.status, 401);
    assert.equal(body.success, false);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/auth/refresh preserves subject and role from token", async () => {
  const server = await startServer();
  try {
    const token = signAccessToken({ sub: "usr_test42", role: "freelancer" });

    const res = await fetch(`${baseUrl(server)}/api/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.success, true);

    const jwt = await import("jsonwebtoken");
    const decoded = jwt.default.decode(body.data.token);
    assert.equal(decoded.sub, "usr_test42", "refreshed token must preserve subject");
    assert.equal(decoded.role, "freelancer", "refreshed token must preserve role");
  } finally {
    await closeServer(server);
  }
});
