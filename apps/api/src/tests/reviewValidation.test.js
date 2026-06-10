import request from "supertest";
import { createApp } from "../app.js";
import { expect } from "chai";

describe("Review API Validation", () => {
  let app;

  before(() => {
    app = createApp();
  });

  it("should allow creating a review with valid data", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({
        jobId: "job_123",
        userId: "user_456",
        rating: 5,
        comment: "Excellent work!"
      });
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
  });

  it("should reject review if rating is out of range", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({
        jobId: "job_123",
        userId: "user_456",
        rating: 6,
        comment: "Too good!"
      });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it("should reject review if required fields are missing", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .send({
        rating: 4
      });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });
});
