import test from "node:test";
import assert from "node:assert";
import request from "supertest";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const app = createApp();

test("Admin metrics endpoint", async (t) => {
  await t.test("Deny access without token", async () => {
    const res = await request(app).get("/api/admin/metrics");
    assert.strictEqual(res.status, 401);
  });

  await t.test("Deny access with non-admin token", async () => {
    const accessToken = signAccessToken({ id: "user_123", role: "client" });
    
    const res = await request(app)
      .get("/api/admin/metrics")
      .set("Authorization", `Bearer ${accessToken}`);
    
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.message, "Forbidden");
  });

  await t.test("Allow access with admin token", async () => {
    const accessToken = signAccessToken({ id: "admin_123", role: "admin" });
    
    const res = await request(app)
      .get("/api/admin/metrics")
      .set("Authorization", `Bearer ${accessToken}`);
    
    // Assert strict success status and structure
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.openJobs !== undefined);
  });
});
