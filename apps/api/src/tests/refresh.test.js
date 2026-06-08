import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import jwt from "jsonwebtoken";

function createTestServer() {
  const app = createApp();
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

test("POST /api/auth/refresh — no token returns 401", async () => {
  const server = await createTestServer();
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 401, `Expected 401, got ${res.status}`);
    const payload = await res.json();
    assert.ok(payload.message, "Should have an error message");
  } finally {
    await closeServer(server);
  }
});

test("POST /api/auth/refresh — invalid token returns 401", async () => {
  const server = await createTestServer();
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid.token.here",
      },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 401, `Expected 401, got ${res.status}`);
  } finally {
    await closeServer(server);
  }
});

test("POST /api/auth/refresh — valid token returns 200 with new access token", async () => {
  const server = await createTestServer();
  const { port } = server.address();

  try {
    // Issue a valid refresh token with the expected payload shape
    const refreshToken = jwt.sign(
      { sub: "usr_testuser", role: "freelancer" },
      "development-secret",
      { expiresIn: "1h" }
    );

    const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 200, `Expected 200, got ${res.status} body: ${JSON.stringify(await res.clone().json())}`);
    const payload = await res.json();
    assert.ok(payload.data?.token, "Response should contain a new access token");

    // Decode the new token and verify it carries the correct identity
    const newToken = jwt.decode(payload.data.token);
    assert.equal(newToken.sub, "usr_testuser", "New token sub should match refresh token sub");
    assert.equal(newToken.role, "freelancer", "New token role should match refresh token role");
  } finally {
    await closeServer(server);
  }
});

test("POST /api/auth/refresh — token in body also works", async () => {
  const server = await createTestServer();
  const { port } = server.address();

  try {
    const refreshToken = jwt.sign(
      { sub: "usr_bodyuser", role: "client" },
      "development-secret",
      { expiresIn: "1h" }
    );

    const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: refreshToken }),
    });

    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    const payload = await res.json();
    assert.ok(payload.data?.token, "Should return new access token");

    const newToken = jwt.decode(payload.data.token);
    assert.equal(newToken.sub, "usr_bodyuser");
    assert.equal(newToken.role, "client");
  } finally {
    await closeServer(server);
  }
});

test("POST /api/auth/refresh — bearer header takes priority over body token", async () => {
  const server = await createTestServer();
  const { port } = server.address();

  try {
    const bearerToken = jwt.sign({ sub: "usr_bearer", role: "admin" }, "development-secret", { expiresIn: "1h" });
    const bodyToken = jwt.sign({ sub: "usr_body", role: "client" }, "development-secret", { expiresIn: "1h" });

    const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify({ token: bodyToken }),
    });

    assert.equal(res.status, 200);
    const payload = await res.json();
    const newToken = jwt.decode(payload.data.token);
    assert.equal(newToken.sub, "usr_bearer", "Bearer header should take priority");
    assert.equal(newToken.role, "admin");
  } finally {
    await closeServer(server);
  }
});

test("POST /api/auth/refresh — expired token returns 401", async () => {
  const server = await createTestServer();
  const { port } = server.address();

  try {
    const expiredToken = jwt.sign(
      { sub: "usr_expired", role: "client" },
      "development-secret",
      { expiresIn: "-1s" } // already expired
    );

    const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${expiredToken}`,
      },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 401, "Expired token should be rejected");
  } finally {
    await closeServer(server);
  }
});
