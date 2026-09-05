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
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

test("GET /api/admin/metrics without token is rejected (401)", async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/api/admin/metrics`);
    assert.equal(response.status, 401);
  } finally {
    await server.close();
  }
});

test("GET /api/admin/metrics with non-admin token is rejected (403)", async () => {
  const server = await startServer();
  try {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const response = await fetch(`${server.baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 403);
  } finally {
    await server.close();
  }
});

test("GET /api/admin/metrics with admin token succeeds (200)", async () => {
  const server = await startServer();
  try {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await fetch(`${server.baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 200);
  } finally {
    await server.close();
  }
});
