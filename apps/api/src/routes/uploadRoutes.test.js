import request from "supertest";
import { expressApp } from "../app.js";

describe("Upload Security Route (#11709)", () => {
  it("should return 401 Unauthorized when unauthenticated request calls POST /api/uploads", async () => {
    const res = await request(expressApp)
      .post("/api/uploads")
      .attach("file", Buffer.from("test content"), "test.txt");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
