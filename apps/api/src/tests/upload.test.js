import test from "node:test";
import assert from "node:assert";
import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

test("POST /api/uploads should return 400 when no file is provided", async () => {
  const response = await request(app).post("/api/uploads");
  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.success, false);
  assert.strictEqual(response.body.message, "No file uploaded");
});
