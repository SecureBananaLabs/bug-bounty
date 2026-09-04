import request from "supertest";
import app from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

describe("Auth Routes", () => {
  it("should reject unauthenticated refresh", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
  });

  it("should preserve authenticated subject and role", async () => {
    const token = signAccessToken({ id: "usr_test", role: "freelancer" });
    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    const decoded = verifyAccessToken(res.body.accessToken);
    expect(decoded.sub).toBe("usr_test");
    expect(decoded.role).toBe("freelancer");
  });
});