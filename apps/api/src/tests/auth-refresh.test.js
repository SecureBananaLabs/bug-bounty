import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

test("POST /api/auth/refresh without token is rejected (401)", async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(response.status, 401);
  } finally {
    await server.close();
  }
});

test("POST /api/auth/refresh with token signs for the requester subject", async () => {
  const server = await startServer();
  try {
    const token = signAccessToken({ sub: "usr_alice", role: "client" });
    const response = await fetch(`${server.baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    assert.equal(response.status, 200);
    const payload = await response.json();
    const decoded = jwt.decode(payload.data.token);
    assert.equal(decoded.sub, "usr_alice");
    assert.equal(decoded.role, "client");
  } finally {
    await server.close();
  }
});
