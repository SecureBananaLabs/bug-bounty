import request from "supertest";
import { createApp } from "../app.js";
import { expect } from "chai";

describe("Proposal Duration Validation", () => {
  let app;

  before(() => {
    app = createApp();
  });

  it("should allow creating a proposal with estimated duration", async () => {
    const res = await request(app)
      .post("/api/proposals")
      .send({
        jobId: "job_123",
        userId: "user_456",
        bidAmount: 500,
        estimatedDuration: 14,
        coverLetter: "I can do it in 2 weeks!"
      });
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
  });

  it("should reject proposal if estimated duration is missing", async () => {
    const res = await request(app)
      .post("/api/proposals")
      .send({
        jobId: "job_123",
        userId: "user_456",
        bidAmount: 500,
        coverLetter: "Forgot the duration!"
      });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
    expect(res.body.message).to.include("estimated duration");
  });

  it("should reject proposal if estimated duration is not positive", async () => {
    const res = await request(app)
      .post("/api/proposals")
      .send({
        jobId: "job_123",
        userId: "user_456",
        bidAmount: 500,
        estimatedDuration: 0,
        coverLetter: "I'll do it for free and in 0 time!"
      });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });
});
