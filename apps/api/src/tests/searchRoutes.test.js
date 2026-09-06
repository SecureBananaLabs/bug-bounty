import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /api/search validates query parameter", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  
  try {
    // Missing query
    let response = await fetch(`http://127.0.0.1:${port}/api/search`);
    let payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);

    // Blank query
    response = await fetch(`http://127.0.0.1:${port}/api/search?q=`);
    payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);

    // Whitespace only
    response = await fetch(`http://127.0.0.1:${port}/api/search?q=%20%20`);
    payload = await response.json();
    assert.equal(response.status, 400);
    assert.equal(payload.success, false);

    // Valid query
    response = await fetch(`http://127.0.0.1:${port}/api/search?q=test`);
    payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(payload.data && typeof payload.data === "object");
  } catch (err) {
    console.error("TEST FAILED:", err);
    throw err;
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
