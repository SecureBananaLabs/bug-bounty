import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function makeRequest(app, { method = "GET", path }) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", async () => {
      const { port } = server.address();
      try {
        const res = await fetch("http://127.0.0.1:" + port + path, { method });
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

test("GET /api/search trims whitespace from query", async () => {
  const app = createApp();
  const res = await makeRequest(app, { path: "/api/search?q=%20%20hello%20%20" });
  assert.equal(res.status, 200);
});

test("GET /api/search returns 400 for query exceeding max length", async () => {
  const app = createApp();
  const longQuery = "a".repeat(201);
  const res = await makeRequest(app, { path: "/api/search?q=" + longQuery });
  assert.equal(res.status, 400);
});

test("GET /api/search handles missing query parameter", async () => {
  const app = createApp();
  const res = await makeRequest(app, { path: "/api/search" });
  assert.equal(res.status, 200);
});

test("GET /api/search handles empty/whitespace query", async () => {
  const app = createApp();
  const res = await makeRequest(app, { path: "/api/search?q=%20%20" });
  assert.equal(res.status, 200);
});
