import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createJob } from "../services/jobService.js";
import { getAdminMetrics } from "../services/adminService.js";
import { createUser } from "../services/userService.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("getAdminMetrics aggregates current in-memory users and jobs", async () => {
  const before = await getAdminMetrics();

  await createUser({
    email: `freelancer-${Date.now()}@example.com`,
    name: "Metrics Freelancer",
    role: "freelancer"
  });
  await createUser({
    email: `client-${Date.now()}@example.com`,
    name: "Metrics Client",
    role: "client"
  });
  await createJob({
    title: "Metrics Search Build",
    description: "Build enough service state for admin metrics.",
    budgetMin: 50,
    budgetMax: 150,
    categoryId: "metrics",
    skills: ["api"]
  });

  const after = await getAdminMetrics();

  assert.equal(after.openJobs, before.openJobs + 1);
  assert.equal(after.activeFreelancers, before.activeFreelancers + 1);
  assert.equal(after.flaggedAccounts, 0);
  assert.equal(after.monthlyVolume, 0);
});

test("GET /api/admin/metrics returns aggregated metrics", async () => {
  const marker = Date.now();

  await createUser({
    email: `admin-metrics-${marker}@example.com`,
    name: "Admin Metrics Freelancer",
    role: "freelancer"
  });
  await createJob({
    title: `Admin Metrics Job ${marker}`,
    description: "Expose current in-memory service state through admin metrics.",
    budgetMin: 25,
    budgetMax: 75,
    categoryId: `admin-metrics-${marker}`,
    skills: []
  });

  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { authorization: `Bearer ${token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(payload.data.openJobs >= 1);
    assert.ok(payload.data.activeFreelancers >= 1);
    assert.equal(payload.data.flaggedAccounts, 0);
    assert.equal(payload.data.monthlyVolume, 0);
  });
});
