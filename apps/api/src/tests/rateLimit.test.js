import express from "express";
import request from "supertest";
import { apiLimiter } from "../middleware/rateLimit.js";

describe("rateLimit middleware", () => {
  let app;
  const originalEnv = process.env.BENCHMARK_TOKEN;

  beforeEach(() => {
    process.env.BENCHMARK_TOKEN = "benchmark-secret-token";
    app = express();
    app.use("/api", apiLimiter);
    app.get("/api/test", (req, res) => {
      res.status(200).json({ ok: true });
    });
  });

  afterEach(() => {
    process.env.BENCHMARK_TOKEN = originalEnv;
  });

  it("applies rate limiting headers for standard requests", async () => {
    const res = await request(app).get("/api/test");
    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("ratelimit-limit");
  });

  it("skips rate limiting when valid x-benchmark-token is provided", async () => {
    const res = await request(app)
      .get("/api/test")
      .set("x-benchmark-token", "benchmark-secret-token");

    expect(res.status).toBe(200);
    expect(res.headers["ratelimit-limit"]).toBeUndefined();
  });

  it("skips rate limiting when valid Authorization Bearer token is provided", async () => {
    const res = await request(app)
      .get("/api/test")
      .set("Authorization", "Bearer benchmark-secret-token");

    expect(res.status).toBe(200);
    expect(res.headers["ratelimit-limit"]).toBeUndefined();
  });

  it("enforces rate limiting when benchmark token does not match", async () => {
    const res = await request(app)
      .get("/api/test")
      .set("x-benchmark-token", "invalid-token");

    expect(res.status).toBe(200);
    expect(res.headers).toHaveProperty("ratelimit-limit");
  });
});
