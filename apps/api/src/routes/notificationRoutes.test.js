import request from "supertest";
import { expressApp } from "../app.js";

describe("Notification Security Route (#11707)", () => {
  it("should return 401 Unauthorized when calling GET /api/notifications without token", async () => {
    const res = await request(expressApp).get("/api/notifications");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
