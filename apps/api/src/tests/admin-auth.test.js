import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function makeRequest(app, { method = "GET", path, token, body }) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", async () => {
      const { port } = server.address();
      const opts = { method, headers: { "Content-Type": "application/json" } };
      if (token) opts.headers.Authorization = "Bearer " + token;
      if (body) opts.body = JSON.stringify(body);
      try {
        const res = await fetch("http://127.0.0.1:" + port + path, opts);
        const text = await res.text();
        let json = null;
        try { json = JSON.parse(text); } catch {}
        resolve({ status: res.status, json, text });
        server.close(() => {});
      } catch (e) {
        reject(e);
        server.close(() => {});
      }
    });
    server.once("error", reject);
  });
}

test("GET /api/admin/metrics without token returns 401", async () => {
  const app = createApp();
  const res = await makeRequest(app, { path: "/api/admin/metrics" });
  assert.equal(res.status, 401);
});

test("GET /api/admin/metrics with non-admin token returns 403", async () => {
  const app = createApp();
  const token = signAccessToken({ sub: "usr_1", role: "client" });
  const res = await makeRequest(app, { path: "/api/admin/metrics", token });
  assert.equal(res.status, 403);
});

test("GET /api/admin/metrics with admin token returns 200", async () => {
  const app = createApp();
  const token = signAccessToken({ sub: "usr_1", role: "admin" });
  const res = await makeRequest(app, { path: "/api/admin/metrics", token });
  assert.equal(res.status, 200);
  assert.equal(res.json.success, true);
  assert.equal(res.json.data.openJobs, 42);
});
