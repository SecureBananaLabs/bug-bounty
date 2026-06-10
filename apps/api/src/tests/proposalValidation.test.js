import request from "supertest";
import { createApp } from "../app.js";
import { expect } from "chai";

describe("Proposal API Validation", () => {
  let app;

  before(() => {
    app = createApp();
  });

  it("should allow creating a proposal with valid data", async () => {
    const res = await request(app)
      .post("/api/proposals")
      .send({
        jobId: "job_123",
        userId: "user_456",
        bidAmount: 500,
        coverLetter: "I am the best for this job!"
      });
    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
  });

  it("should reject proposal if bidAmount is negative or zero", async () => {
    const res = await request(app)
      .post("/api/proposals")
      .send({
        jobId: "job_123",
        userId: "user_456",
        bidAmount: -10,
        coverLetter: "Cheap price!"
      });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });

  it("should reject proposal if required fields are missing", async () => {
    const res = await request(app)
      .post("/api/proposals")
      .send({
        bidAmount: 100
      });
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
  });
});
