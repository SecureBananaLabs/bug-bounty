import test from "node:test";
import assert from "node:assert/strict";
import { createJobSchema } from "../validators/job.js";
import { createJob } from "../services/jobService.js";

test("createJobSchema preserves clientId for valid job payloads", () => {
  const payload = createJobSchema.parse({
    title: "Build a marketplace dashboard",
    description: "Create a dashboard for marketplace clients",
    budgetMin: 500,
    budgetMax: 1500,
    clientId: "usr_client_123",
    categoryId: "cat_web",
    skills: ["nextjs", "typescript"]
  });

  assert.equal(payload.clientId, "usr_client_123");
});

test("createJobSchema rejects job creation without clientId", () => {
  assert.throws(
    () =>
      createJobSchema.parse({
        title: "Build a marketplace dashboard",
        description: "Create a dashboard for marketplace clients",
        budgetMin: 500,
        budgetMax: 1500,
        categoryId: "cat_web",
        skills: ["nextjs"]
      }),
    /clientId/
  );
});

test("createJobSchema rejects blank clientId values", () => {
  assert.throws(
    () =>
      createJobSchema.parse({
        title: "Build a marketplace dashboard",
        description: "Create a dashboard for marketplace clients",
        budgetMin: 500,
        budgetMax: 1500,
        clientId: "   ",
        categoryId: "cat_web",
        skills: ["nextjs"]
      }),
    /clientId/
  );
});

test("createJob keeps the validated clientId on the created job", async () => {
  const payload = createJobSchema.parse({
    title: "Build a marketplace dashboard",
    description: "Create a dashboard for marketplace clients",
    budgetMin: 500,
    budgetMax: 1500,
    clientId: "usr_client_456",
    categoryId: "cat_web",
    skills: ["nextjs"]
  });

  const job = await createJob(payload);

  assert.equal(job.clientId, "usr_client_456");
  assert.equal(job.status, "open");
});
