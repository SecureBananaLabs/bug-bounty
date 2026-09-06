import request from "supertest";
import { expressApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

describe("Admin Metrics RBAC Route (#11713)", () => {
  it("should return 403 Forbidden when non-admin user requests metrics", async () => {
    const userToken = signAccessToken({ id: "user-1", role: "freelancer" });
    const res = await request(expressApp)
      .get("/api/admin/metrics")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
