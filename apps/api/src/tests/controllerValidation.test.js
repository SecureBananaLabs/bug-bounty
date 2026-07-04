import test from "node:test";
import assert from "node:assert/strict";

test("6 API Controllers Input Validation", async (t) => {
  process.env.JWT_SECRET = "test-jwt-secret-123456";
  const { createApp } = await import("../app.js");
  const { signAccessToken } = await import("../utils/jwt.js");

  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_test", role: "client" });

  t.after(() => {
    server.close();
  });

  const testCases = [
    {
      path: "/api/proposals",
      payload: { bidAmount: -10 }
    },
    {
      path: "/api/messages",
      payload: { body: "" }
    },
    {
      path: "/api/reviews",
      payload: { rating: 6, comment: "" }
    },
    {
      path: "/api/users",
      payload: { email: "notanemail", role: "admin" }
    },
    {
      path: "/api/notifications",
      payload: { title: "" }
    },
    {
      path: "/api/payments",
      payload: { amount: -50 }
    }
  ];

  for (const { path, payload } of testCases) {
    await t.test(`POST ${path} rejects invalid payload with 400`, async () => {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      assert.equal(response.status, 400);
      const data = await response.json();
      assert.equal(data.success, false);
    });
  }
});
