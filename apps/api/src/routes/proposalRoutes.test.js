import request from "supertest";
import { expressApp } from "../app.js";

describe("Proposal Creation Validation Route (#11711)", () => {
  it("should return 400 Bad Request when estimatedDuration is missing", async () => {
    const res = await request(expressApp)
      .post("/api/proposals")
      .send({ jobId: "job-1", coverLetter: "I can build this" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("estimatedDuration is required");
  });

  it("should accept valid proposal with estimatedDuration", async () => {
    const res = await request(expressApp)
      .post("/api/proposals")
      .send({ jobId: "job-1", coverLetter: "I can build this", estimatedDuration: 5 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
