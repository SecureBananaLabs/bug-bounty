import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/reviews requires authentication middleware", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    // 1. Unauthenticated request should fail with 401
    const unauthRes = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: 5, comment: "Spam test" })
    });

    assert.equal(unauthRes.status, 401, "Expected 401 Unauthorized for missing auth header");
    const unauthPayload = await unauthRes.json();
    assert.equal(unauthPayload.success, false);
    assert.equal(unauthPayload.message, "Unauthorized");

    // 2. Authenticated request should succeed with 201
    const token = signAccessToken({ id: "user_test_123", email: "test@example.com" });
    const authRes = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ rating: 5, comment: "Great freelancer!" })
    });

    assert.equal(authRes.status, 201, "Expected 201 Created with valid token");
    const authPayload = await authRes.json();
    assert.equal(authPayload.success, true);
    assert.equal(authPayload.data.comment, "Great freelancer!");

    // 3. GET /api/reviews should still work for unauthenticated viewers
    const getRes = await fetch(`${baseUrl}/api/reviews`);
    assert.equal(getRes.status, 200, "GET /api/reviews should remain public");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
