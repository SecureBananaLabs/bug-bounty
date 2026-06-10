import request from "supertest";
import { createApp } from "../app.js";
import { expect } from "chai";

describe("Search API Validation", () => {
  let app;

  before(() => {
    app = createApp();
  });

  it("should allow search with a valid query string", async () => {
    const res = await request(app).get("/api/search?q=valid_query");
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.have.property("query", "valid_query");
  });

  it("should reject search with a query string exceeding 100 chars", async () => {
    const longQuery = "a".repeat(101);
    const res = await request(app).get(`/api/search?q=${longQuery}`);
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
    expect(res.body.message).to.include("Query too long");
  });

  it("should reject search without a query parameter", async () => {
    const res = await request(app).get("/api/search");
    expect(res.status).to.equal(400);
    expect(res.body.success).to.equal(false);
    expect(res.body.message).to.include("Required"); // Zod's default for missing required fields
  });
});
