import test from "node:test";
import assert from "node:assert/strict";

test("POST with malformed JSON payload", async (t) => {
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
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("returns 400 Bad Request on malformed JSON payload", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: "{ invalid json"
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.message.toLowerCase().includes("json") || body.message.toLowerCase().includes("malformed") || body.message.toLowerCase().includes("invalid"));
  });
});
