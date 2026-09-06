import request from "supertest";
import { expressApp } from "../app.js";

describe("Payment Security Route (#11699)", () => {
  it("should return 401 Unauthorized when unauthenticated request posts payment", async () => {
    const res = await request(expressApp)
      .post("/api/payments")
      .send({ amount: 100, currency: "USD" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
