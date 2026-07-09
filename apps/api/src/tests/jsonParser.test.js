import test from "node:test";
import assert from "node:assert/strict";

test("POST /api/jobs JSON parse and body limit checks", async (t) => {
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

  await t.test("rejects malformed JSON with 400", async () => {
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"title": "invalid JSON'
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("rejects oversized JSON body with 413", async () => {
    const largeStr = "a".repeat(120 * 1024); // 120kb (larger than 100kb limit)
    const res = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: largeStr })
    });
    assert.equal(res.status, 413);
    const body = await res.json();
    assert.equal(body.success, false);
  });
});
