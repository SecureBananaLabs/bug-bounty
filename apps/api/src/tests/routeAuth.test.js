import test from "node:test";
import assert from "node:assert/strict";

test("Global Route Authentication Enforcer", async (t) => {
  process.env.JWT_SECRET = "test-jwt-secret-123456";
  const { createApp } = await import("../app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  t.after(() => {
    server.close();
  });

  const targetRoutes = [
    { method: "GET", path: "/api/users" },
    { method: "GET", path: "/api/jobs" },
    { method: "GET", path: "/api/proposals" },
    { method: "POST", path: "/api/payments" },
    { method: "GET", path: "/api/reviews" },
    { method: "GET", path: "/api/messages" },
    { method: "GET", path: "/api/notifications" },
    { method: "POST", path: "/api/uploads" },
    { method: "GET", path: "/api/search" }
  ];

  for (const { method, path } of targetRoutes) {
    await t.test(`${method} ${path} rejects anonymous requests`, async () => {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method,
        headers: { "Content-Type": "application/json" }
      });
      assert.equal(response.status, 401);
      const data = await response.json();
      assert.equal(data.success, false);
      assert.match(data.message, /Unauthorized/i);
    });
  }
});
