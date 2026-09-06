import request from "supertest";
import { app } from "../app.js";

describe("Admin Metrics RBAC Authorization (#11590)", () => {
  it("GET /api/admin/metrics should return 401 unauthenticated", async () => {
    const res = await request(app).get("/api/admin/metrics");
    expect(res.status).toBe(401);
  });
});
