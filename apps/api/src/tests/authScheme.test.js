import test from "node:test";
import assert from "node:assert/strict";
import { signAccessToken } from "../utils/jwt.js";

test("GET /api/admin/metrics scheme case-insensitivity", async (t) => {
  process.env.JWT_SECRET = "testsecret";
  const { createApp } = await import("../app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(async () => {
    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  const token = signAccessToken({ userId: "usr_123", role: "admin" });

  await t.test("allows exact 'Bearer ' scheme", async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
  });

  await t.test("allows lowercase 'bearer ' scheme", async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `bearer ${token}` }
    });
    assert.equal(res.status, 200);
  });

  await t.test("allows uppercase 'BEARER ' scheme", async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `BEARER ${token}` }
    });
    assert.equal(res.status, 200);
  });

  await t.test("rejects Basic scheme with 401", async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Basic ${token}` }
    });
    assert.equal(res.status, 401);
  });
});
