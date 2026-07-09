import test from "node:test";
import assert from "node:assert/strict";

test("POST /api/auth rate limiting", async (t) => {
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

  await t.test("rejects request 21 with status 429", async () => {
    for (let i = 1; i <= 21; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123"
        })
      });
      if (i === 21) {
        assert.equal(res.status, 429);
      } else {
        assert.notEqual(res.status, 429);
      }
    }
  });
});
