import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

describe("GET /api/search", () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}/api/search`;
  });

  afterEach(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      server = null;
    }
  });

  it("valid search returns 200 with result payload", async () => {
    const res = await fetch(`${baseUrl}?q=javascript`);
    const payload = await res.json();
    assert.equal(res.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "javascript");
    assert.deepEqual(payload.data.users, []);
    assert.deepEqual(payload.data.jobs, []);
    assert.deepEqual(payload.data.freelancers, []);
  });

  it("missing q returns 200 with default empty string query", async () => {
    const res = await fetch(baseUrl);
    const payload = await res.json();
    assert.equal(res.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "");
  });

  it("whitespace q returns 200 with trimmed empty string", async () => {
    const res = await fetch(`${baseUrl}?q=%20%20%20`);
    const payload = await res.json();
    assert.equal(res.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, "");
  });

  it("q exceeding 200 characters returns 400", async () => {
    const longQuery = "a".repeat(201);
    const res = await fetch(`${baseUrl}?q=${longQuery}`);
    const payload = await res.json();
    assert.equal(res.status, 400);
    assert.equal(payload.ok, false);
    assert.ok(payload.error);
    assert.ok(Array.isArray(payload.issues));
  });

  it("query with exactly 200 characters returns 200", async () => {
    const exactQuery = "a".repeat(200);
    const res = await fetch(`${baseUrl}?q=${exactQuery}`);
    const payload = await res.json();
    assert.equal(res.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, exactQuery);
  });
});
