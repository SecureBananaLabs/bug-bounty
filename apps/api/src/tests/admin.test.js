import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";

const token = jwt.sign({ sub: "admin_1", role: "admin" }, process.env.JWT_SECRET ?? "development-secret");
const userToken = jwt.sign({ sub: "client_1", role: "client" }, process.env.JWT_SECRET ?? "development-secret");

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("admin metrics are protected and return summary data", async () => {
  await withServer(async (baseUrl) => {
    const forbidden = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(forbidden.status, 401);

    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.totalUsers, 5);
    assert.equal(payload.data.flaggedListings, 1);
  });
});

test("non-admin tokens are forbidden from admin routes", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { authorization: `Bearer ${userToken}` }
    });

    assert.equal(response.status, 403);
  });
});

test("admin users endpoint supports pagination", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/admin/users?page=1&limit=2`, {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.data.page, 1);
    assert.equal(payload.data.limit, 2);
    assert.equal(payload.data.total, 5);
    assert.equal(payload.data.items.length, 2);
  });
});
