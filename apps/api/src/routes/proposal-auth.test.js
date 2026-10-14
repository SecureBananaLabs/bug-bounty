import request from "supertest";
import { app } from "../app.js";

describe("Proposal Creation Auth Requirement (#11618)", () => {
  it("GET /api/proposals should allow public reads without auth", async () => {
    const res = await request(app).get("/api/proposals");
    expect(res.status).not.toBe(401);
  });

  it("POST /api/proposals should return 401 unauthenticated", async () => {
    const res = await request(app)
      .post("/api/proposals")
      .send({ title: "Test Proposal", description: "Desc", budget: 100 });
    expect(res.status).toBe(401);
  });
});
