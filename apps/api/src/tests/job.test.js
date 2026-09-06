import test from "node:test";
import assert from "node:assert";
import request from "supertest";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const app = createApp();

test("Job endpoint authentication", async (t) => {
  await t.test("Allow public access to GET /api/jobs", async () => {
    const res = await request(app).get("/api/jobs");
    // Focus on auth behavior: it should not be 401 or 403
    assert.ok(res.status !== 401 && res.status !== 403, "Public endpoint should not return auth errors");
  });

  await t.test("Deny access without token to POST /api/jobs", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .send({ title: "New Job", description: "Job description" });
    assert.strictEqual(res.status, 401);
  });

  await t.test("Allow access with valid token to POST /api/jobs", async () => {
    const accessToken = signAccessToken({ id: "user_123", role: "client" });

    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ 
        title: "New Job",
        description: "Job description",
        budgetMin: 50,
        budgetMax: 200,
        categoryId: "cat_1"
      });

    // Focus on auth behavior: it should pass authMiddleware
    assert.ok(res.status !== 401 && res.status !== 403, "Authorized request should pass authMiddleware");
  });
});
