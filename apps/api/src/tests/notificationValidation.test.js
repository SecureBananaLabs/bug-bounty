import request from "supertest";
import { createApp } from "../app.js";
import { expect } from "chai";

describe("Notification API Validation", () => {
  let app;

  before(() => {
    app = createApp();
  });

  it("should allow creating a notification with valid data", async () => {
    const res = await request(app)
      .post("/api/notifications")
      .send({
        userId: "user_123",
        type: "info",
        message: "Your profile is updated!"
      });
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
  });

  it("should reject notification if type is invalid", async () => {
    const res = await request(app)
      .post("/api/notifications")
      .send({
        userId: "user_123",
        type: "super-critical",
        message: "This type does not exist"
      });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it("should reject notification if required fields are missing", async () => {
    const res = await request(app)
      .post("/api/notifications")
      .send({
        type: "info"
      });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });
});
