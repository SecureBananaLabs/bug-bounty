import request from "supertest";
import { app } from "../app.js";

describe("GET /api/users Auth Protection (#11595)", () => {
  it("GET /api/users should return 401 unauthenticated", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });
});
