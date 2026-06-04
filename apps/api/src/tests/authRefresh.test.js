import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

function listen(app) {
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/auth/refresh rejects missing refresh token", async () => {
  const app = createApp();
  const server = await listen(app);

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({})
    });

    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  } finally {
    await close(server);
  }
});

test("POST /api/auth/refresh validates refresh token claims and returns a new access token", async () => {
  const app = createApp();
  const server = await listen(app);

  try {
    const refreshToken = signAccessToken({ sub: "usr_123", role: "client" });
    const { port } = server.address();

    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ refreshToken })
    });

    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(typeof payload.data.token, "string");
    const decoded = verifyAccessToken(payload.data.token);
    assert.equal(decoded.sub, "usr_123");
    assert.equal(decoded.role, "client");
  } finally {
    await close(server);
  }
});

test("POST /api/auth/refresh rejects invalid refresh tokens", async () => {
  const app = createApp();
  const server = await listen(app);

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ refreshToken: "not-a-token" })
    });

    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid refresh token");
  } finally {
    await close(server);
  }
});
