import { test, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../app.js";

describe("POST /api/auth/register", () => {
  test("returns 400 when trying to register with admin role", async () => {
    const app = createApp();
    const res = await request(app).post(`/api/auth/register`).send({
      email: "test@example.com",
      password: "password123",
      role: "admin"
    });
    
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });
});
