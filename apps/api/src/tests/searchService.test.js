import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";
import { globalSearch } from "../services/searchService.js";
import { createUser } from "../services/userService.js";

test("globalSearch returns matching users and jobs without sensitive user fields", async () => {
  await createUser({
    email: "maya@example.com",
    name: "Maya Support",
    password: "super-secret",
    role: "freelancer"
  });
  await createJob({
    title: "Build an AI support workflow",
    description: "Automate customer support tickets",
    budgetMin: 500,
    budgetMax: 1200,
    categoryId: "automation"
  });

  const result = await globalSearch(" SUPPORT ");

  assert.equal(result.query, "support");
  assert.equal(result.users.length, 1);
  assert.equal(result.users[0].email, "maya@example.com");
  assert.equal(Object.hasOwn(result.users[0], "password"), false);
  assert.equal(result.jobs.length, 1);
  assert.equal(result.jobs[0].title, "Build an AI support workflow");
  assert.deepEqual(result.freelancers, []);
});

test("globalSearch returns empty result groups for blank queries", async () => {
  const result = await globalSearch("   ");

  assert.deepEqual(result, {
    query: "",
    users: [],
    jobs: [],
    freelancers: []
  });
});
