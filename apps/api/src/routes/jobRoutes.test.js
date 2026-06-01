import { jest } from "@jest/globals";

// Mock controller functions
const mockGetJobs = jest.fn((req, res) => res.status(200).json([]));
const mockPostJob = jest.fn((req, res) => res.status(201).json({ id: "job_1" }));

jest.unstable_mockModule("../controllers/jobController.js", () => ({
  getJobs: mockGetJobs,
  postJob: mockPostJob,
}));

const { jobRoutes } = await import("./jobRoutes.js");

import express from "express";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/jobs", jobRoutes);
  return app;
}

import { createServer } from "http";
import { promisify } from "util";

async function request(app, method, path, headers = {}, body = null) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const url = `http://localhost:${port}${path}`;
  const opts = { method, headers };
  if (body) {
    opts.body = JSON.stringify(body);
    opts.headers["content-type"] = "application/json";
  }
  const res = await fetch(url, opts);
  await promisify(server.close.bind(server))();
  return res;
}

describe("POST /api/jobs authentication", () => {
  test("returns 401 when no Authorization header is provided", async () => {
    const app = buildApp();
    const res = await request(app, "POST", "/api/jobs", {}, { title: "Test Job" });
    expect(res.status).toBe(401);
  });

  test("returns 401 when Authorization header is malformed", async () => {
    const app = buildApp();
    const res = await request(app, "POST", "/api/jobs", { authorization: "InvalidToken" }, { title: "Test Job" });
    expect(res.status).toBe(401);
  });

  test("calls postJob when valid Bearer token is provided", async () => {
    const app = buildApp();
    const res = await request(app, "POST", "/api/jobs", { authorization: "Bearer valid-token" }, { title: "Test Job" });
    expect(res.status).toBe(201);
    expect(mockPostJob).toHaveBeenCalled();
  });

  test("GET /api/jobs does not require authentication", async () => {
    const app = buildApp();
    const res = await request(app, "GET", "/api/jobs");
    expect(res.status).toBe(200);
  });
});
