import request from "supertest";
import { expressApp } from "../app.js";

describe("Job Creation Auth Security Route (#11697)", () => {
  it("should return 401 Unauthorized when unauthenticated request posts job", async () => {
    const res = await request(expressApp)
      .post("/api/jobs")
      .send({ title: "Frontend Developer", budgetMin: 500, budgetMax: 1000 });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
