import request from "supertest";
import { expressApp } from "../app.js";

describe("Message Security Route (#11705)", () => {
  it("should return 401 Unauthorized when calling GET /api/messages without token", async () => {
    const res = await request(expressApp).get("/api/messages");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
