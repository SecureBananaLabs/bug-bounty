import test from "node:test";
import assert from "node:assert/strict";

test("CORS configuration origin restriction", async (t) => {
  process.env.JWT_SECRET = "testsecret";
  process.env.CORS_ORIGIN = "http://allowed.com,http://trusted.com";

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
    delete process.env.CORS_ORIGIN;
    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("allows configured origin", async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { "Origin": "http://allowed.com" }
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), "http://allowed.com");
  });

  await t.test("allows another configured origin", async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { "Origin": "http://trusted.com" }
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), "http://trusted.com");
  });

  await t.test("allows request without Origin header", async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
  });

  await t.test("rejects unauthorized origin", async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { "Origin": "http://hacker.com" }
    });
    const allowOrigin = res.headers.get("access-control-allow-origin");
    assert.ok(!allowOrigin || allowOrigin !== "http://hacker.com");
  });
});
