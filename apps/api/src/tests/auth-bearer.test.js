import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Auth accepts lowercase 'bearer' scheme", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const token = signAccessToken({ sub: "user_123", role: "client" });

  const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { Authorization: `bearer ${token}` }
  });

  assert.equal(res.status !== 401, true, "Should accept lowercase bearer (not 401)");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("Auth accepts uppercase 'BEARER' scheme", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const token = signAccessToken({ sub: "user_123", role: "client" });

  const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { Authorization: `BEARER ${token}` }
  });

  assert.equal(res.status !== 401, true, "Should accept uppercase BEARER (not 401)");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("Auth rejects missing Authorization header", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`);

  assert.equal(res.status, 401, "Should reject missing header with 401");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
