import request from "supertest";
import { createApp } from "../app.js";
import { expect } from "chai";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

describe("User Registration ID Consistency", () => {
  let app;

  before(() => {
    app = createApp();
  });

  it("should ensure the user ID matches the JWT subject (sub)", async () => {
    const payload = {
      email: "test_id_match@example.com",
      password: "password123",
      role: "client"
    };

    const res = await request(app)
      .post("/api/auth/register")
      .send(payload);
    
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);

    const { id, token } = res.body.data;
    const decoded = jwt.verify(token, env.jwtSecret);
    
    expect(id).to.equal(decoded.sub, "The User ID and JWT subject must be identical");
  });

  it("should return 400 for invalid registration data", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "invalid-email" }); // Missing password and invalid email
    
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });
});
