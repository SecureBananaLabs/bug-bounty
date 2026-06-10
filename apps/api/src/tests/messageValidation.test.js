import request from "supertest";
import { createApp } from "../app.js";
import { expect } from "chai";

describe("Message API Validation", () => {
  let app;

  before(() => {
    app = createApp();
  });

  it("should allow sending a message with valid data", async () => {
    const res = await request(app)
      .post("/api/messages")
      .send({
        senderId: "user_1",
        receiverId: "user_2",
        content: "Hello there!"
      });
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
  });

  it("should reject message if required fields are missing", async () => {
    const res = await request(app)
      .post("/api/messages")
      .send({
        content: "Hello without IDs"
      });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it("should reject message if content is too long", async () => {
    const res = await request(app)
      .post("/api/messages")
      .send({
        senderId: "user_1",
        receiverId: "user_2",
        content: "a".repeat(5001)
      });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });
});
