import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("Admin routes should block non-admin users", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_123", role: "client" });
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    assert.equal(response.status, 403, `Expected 403 Forbidden, got ${response.status}`);
  });
});

test("Admin routes should allow admin users", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    assert.equal(response.status, 200, `Expected 200 OK, got ${response.status}`);
  });
});
