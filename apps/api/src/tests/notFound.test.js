import test from "node:test";
import assert from "node:assert/strict";

test("API unknown route fallback", async (t) => {
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

  await t.test("returns JSON 404 for unknown route", async () => {
    const res = await fetch(`${baseUrl}/api/does-not-exist`, {
      method: "GET"
    });
    assert.equal(res.status, 404);
    assert.equal(res.headers.get("content-type").includes("application/json"), true);
    
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Route not found");
  });
});
