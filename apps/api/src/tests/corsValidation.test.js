import request from "supertest";
import { createApp } from "../app.js";
import { expect } from "chai";

describe("CORS Validation", () => {
  let app;

  before(() => {
    app = createApp();
  });

  it("should allow requests from allowed origins (localhost:3000)", async () => {
    const res = await request(app)
      .get("/api/search?q=test")
      .set("Origin", "http://localhost:3000");
    
    expect(res.headers["access-control-allow-origin"]).to.equal("http://localhost:3000");
  });

  it("should reject requests from disallowed origins (evil.com)", async () => {
    const res = await request(app)
      .get("/api/search?q=test")
      .set("Origin", "https://evil.com");
    
    expect(res.headers["access-control-allow-origin"]).to.be.undefined;
  });
});
