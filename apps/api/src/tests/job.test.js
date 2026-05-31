import test from "node:test";
import assert from "node:assert";
import request from "supertest";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const app = createApp();

test("Job endpoint authentication", async (t) => {
  await t.test("Allow public access to GET /api/jobs", async () => {
    const res = await request(app).get("/api/jobs");
    // Controller might return 200 with an empty array or mocked data
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
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
    
    // We expect it to pass authMiddleware. The controller might return 201 for a created job.
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.title, "New Job");
  });
});
