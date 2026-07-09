import test from "node:test";
import assert from "node:assert";
import request from "supertest";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const app = createApp();

test("Upload endpoint authentication", async (t) => {
  await t.test("Deny access without token", async () => {
    const res = await request(app)
      .post("/api/uploads")
      .attach("file", Buffer.from("test content"), "test.txt");
    assert.strictEqual(res.status, 401);
  });

  await t.test("Allow access with valid token", async () => {
    const accessToken = signAccessToken({ id: "user_123", role: "client" });
    
    const res = await request(app)
      .post("/api/uploads")
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", Buffer.from("test content"), "test.txt");
    
    // Assert strict success status and structure
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.filename, "test.txt");
  });
});
