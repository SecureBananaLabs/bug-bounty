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

test("Admin metrics request without token returns 401", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Unauthorized");
  });
});

test("Admin metrics request with client token returns 403 Forbidden", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Forbidden/i);
  });
});

test("Admin metrics request with freelancer token returns 403 Forbidden", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_freelancer", role: "freelancer" });
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Forbidden/i);
  });
});

test("Admin metrics request with admin token returns 200 with metrics", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.openJobs !== undefined);
    assert.ok(body.data.monthlyVolume !== undefined);
  });
});
