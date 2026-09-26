import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createApp } from "../app.js";

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = createApp().listen(0, resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});

describe("method not allowed fallback", () => {
  it("returns a JSON 405 response for unsupported collection methods", async () => {
    const response = await fetch(`${baseUrl}/api/jobs`, { method: "PUT" });
    const body = await response.json();

    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "GET, POST");
    assert.equal(response.headers.get("content-type").includes("application/json"), true);
    assert.deepEqual(body, { success: false, message: "Method not allowed" });
  });

  it("keeps supported collection methods working", async () => {
    const response = await fetch(`${baseUrl}/api/jobs`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(Array.isArray(body.data), true);
  });

  it("sets route-specific Allow headers for single-method collections", async () => {
    const response = await fetch(`${baseUrl}/api/search`, { method: "DELETE" });
    const body = await response.json();

    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "GET");
    assert.deepEqual(body, { success: false, message: "Method not allowed" });
  });
});
