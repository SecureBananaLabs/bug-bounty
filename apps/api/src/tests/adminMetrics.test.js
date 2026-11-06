import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { getAdminMetrics } from "../services/adminService.js";
import { createJob } from "../services/jobService.js";
import { createUser } from "../services/userService.js";
import { signAccessToken } from "../utils/jwt.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test("getAdminMetrics is derived from the stored records", async () => {
  const before = await getAdminMetrics();

  await createJob({
    title: "Build a dashboard",
    description: "Chart usage for an existing API",
    budgetMin: 100,
    budgetMax: 400,
    categoryId: "cat_data",
    skills: ["react"]
  });
  await createUser({ email: "dev@example.com", role: "freelancer" });

  const after = await getAdminMetrics();

  assert.equal(after.openJobs, before.openJobs + 1);
  assert.equal(after.activeFreelancers, before.activeFreelancers + 1);
  assert.equal(after.monthlyVolume, before.monthlyVolume + 400);
});

test("admin metrics route serves the computed values", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };

    const response = await fetch(`${base}/api/admin/metrics`, { headers });
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(typeof body.data.openJobs, "number");
    assert.equal(typeof body.data.monthlyVolume, "number");
  } finally {
    await close(server);
  }
});
