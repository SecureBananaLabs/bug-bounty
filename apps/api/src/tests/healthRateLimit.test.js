import test from "node:test";
import assert from "node:assert/strict";

test("GET /health rate limiting bypass", async (t) => {
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

  await t.test("allows health requests after exceeding rate limit quota", async () => {
    for (let i = 1; i <= 205; i++) {
      const res = await fetch(`${baseUrl}/health`);
      if (res.status !== 200) {
        throw new Error(`request ${i} returned ${res.status}`);
      }
    }
  });
});
