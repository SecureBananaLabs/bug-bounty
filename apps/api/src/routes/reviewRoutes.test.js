import request from "supertest";
import { expressApp } from "../app.js";

describe("Review Security Route (#11703)", () => {
  it("should return 401 Unauthorized when unauthenticated request posts review", async () => {
    const res = await request(expressApp)
      .post("/api/reviews")
      .send({ rating: 5, comment: "Great service" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
