import request from "supertest";
import { expressApp } from "../app.js";

describe("Proposal Creation Auth Security Route (#11701)", () => {
  it("should return 401 Unauthorized when unauthenticated request posts proposal", async () => {
    const res = await request(expressApp)
      .post("/api/proposals")
      .send({ jobId: "job-1", coverLetter: "Test", estimatedDuration: 5 });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
