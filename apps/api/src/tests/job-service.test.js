import test from "node:test";
import assert from "node:assert/strict";
import { createJob } from "../services/jobService.js";

test("createJob preserves the server-generated id and default status", async () => {
  const result = await createJob({
    title: "Backend fix",
    description: "Tight scope",
    budget: 100,
    id: "job_attacker_supplied",
    status: "closed"
  });

  assert.equal(result.title, "Backend fix");
  assert.equal(result.description, "Tight scope");
  assert.equal(result.budget, 100);
  assert.match(result.id, /^job_\d+$/);
  assert.notEqual(result.id, "job_attacker_supplied");
  assert.equal(result.status, "open");
});
