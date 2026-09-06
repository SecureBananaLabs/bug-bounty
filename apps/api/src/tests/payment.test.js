import test from "node:test";
import assert from "node:assert";
import request from "supertest";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const app = createApp();

test("Payment endpoint authentication", async (t) => {
  await t.test("Deny access without token", async () => {
    const res = await request(app)
      .post("/api/payments")
      .send({ amount: 100 });
    assert.strictEqual(res.status, 401);
  });

  await t.test("Allow access with valid token", async () => {
    const accessToken = signAccessToken({ id: "user_123", role: "client" });
    
    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ amount: 100 });
    
    // Assert strict success status and structure
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.amount, 100);
  });
});
