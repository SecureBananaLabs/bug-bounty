import request from "supertest";
import { createApp } from "../app.js";
import { expect } from "chai";

describe("User Profile Routing", () => {
  let app;

  before(() => {
    app = createApp();
  });

  it("should return 404 for a non-existent username", async () => {
    const res = await request(app).get("/api/users/non-existent-user-123");
    expect(res.status).to.equal(404);
    expect(res.body.success).to.equal(false);
  });

  it("should return 200 and user data for a mock username", async () => {
    // Note: Since we are using mock in-memory storage, 
    // we first create a user to ensure they exist.
    await request(app).post("/api/users").send({
      username: "test-pro-user",
      email: "pro@example.com",
      password: "password123",
      role: "freelancer"
    });

    const res = await request(app).get("/api/users/test-pro-user");
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.have.property("username", "test-pro-user");
  });
});
