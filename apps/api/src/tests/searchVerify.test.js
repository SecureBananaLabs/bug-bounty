import test from "node:test";
import assert from "node:assert/strict";

test("GET /api/search query validations", async (t) => {
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

  await t.test("rejects missing query parameter q with 400", async () => {
    const res = await fetch(`${baseUrl}/api/search`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("rejects empty/blank query parameter q with 400", async () => {
    const res = await fetch(`${baseUrl}/api/search?q=%20%20%20`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("rejects queries exceeding 200 characters with 400", async () => {
    const longQuery = "a".repeat(201);
    const res = await fetch(`${baseUrl}/api/search?q=${longQuery}`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("allows valid query with 200", async () => {
    const res = await fetch(`${baseUrl}/api/search?q=valid`);
    assert.equal(res.status, 200);
  });
});
