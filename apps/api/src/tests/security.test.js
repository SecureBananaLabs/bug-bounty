import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return {
    server,
    baseUrl: `http://127.0.0.1:${server.address().port}`
  };
}

async function stopServer(server) {
  server.close();
}

test("public registration rejects admin role", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "attacker@example.com",
        password: "correct-horse-battery-staple",
        role: "admin"
      })
    });

    assert.equal(response.status, 400);
  } finally {
    await stopServer(server);
  }
});

test("non-admin tokens cannot access admin metrics", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const token = signAccessToken({
      sub: "usr_client_test",
      role: "client"
    });

    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    assert.equal(response.status, 403);
  } finally {
    await stopServer(server);
  }
});

test("admin tokens can access admin metrics", async () => {
  const { server, baseUrl } = await startServer();

  try {
    const token = signAccessToken({
      sub: "usr_admin_test",
      role: "admin"
    });

    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.success, true);
  } finally {
    await stopServer(server);
  }
});
