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
    
    // We expect it to pass authMiddleware. The controller might return 200 or something else if file upload logic fails (e.g., missing bucket), but it shouldn't be 401.
    assert.notStrictEqual(res.status, 401);
  });
});
