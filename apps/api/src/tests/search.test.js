import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createJob } from "../services/jobService.js";
import { globalSearch } from "../services/searchService.js";
import { createUser } from "../services/userService.js";

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

test("globalSearch returns matching users and jobs", async () => {
  const suffix = Date.now();
  const userEmail = `search-${suffix}@example.com`;
  const jobTitle = `Need GraphQL Audit ${suffix}`;

  await createUser({ email: userEmail, name: `Search User ${suffix}`, role: "client" });
  await createJob({
    title: jobTitle,
    description: "Audit API search behavior for stored records.",
    budgetMin: 100,
    budgetMax: 200,
    categoryId: `security-${suffix}`,
    skills: ["api"]
  });

  const byEmail = await globalSearch(userEmail.toUpperCase());
  assert.equal(byEmail.query, userEmail);
  assert.equal(byEmail.users.length, 1);
  assert.equal(byEmail.users[0].email, userEmail);
  assert.deepEqual(byEmail.jobs, []);

  const byJob = await globalSearch(`graphql audit ${suffix}`);
  assert.equal(byJob.jobs.length, 1);
  assert.equal(byJob.jobs[0].title, jobTitle);
  assert.deepEqual(byJob.freelancers, []);
});

test("GET /api/search returns stored service results", async () => {
  const suffix = Date.now();
  const categoryId = `marketplace-${suffix}`;

  await createJob({
    title: `Marketplace Cleanup ${suffix}`,
    description: "Clean up marketplace search result wiring.",
    budgetMin: 50,
    budgetMax: 150,
    categoryId,
    skills: ["search"]
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/search?q=${encodeURIComponent(categoryId)}`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.query, categoryId);
    assert.equal(payload.data.jobs.length, 1);
    assert.equal(payload.data.jobs[0].categoryId, categoryId);
    assert.deepEqual(payload.data.users, []);
  });
});
