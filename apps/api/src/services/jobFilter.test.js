import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { listJobs, createJob } from "./jobService.js";

describe("Job Query Filtering (#743)", () => {
  it("filters jobs by status and categoryId", async () => {
    await createJob({ title: "Frontend Fix", categoryId: "cat_frontend", budgetMin: 100, budgetMax: 200, status: "open" });
    await createJob({ title: "Backend API", categoryId: "cat_backend", budgetMin: 300, budgetMax: 500, status: "completed" });

    const openJobs = await listJobs({ status: "open" });
    assert.ok(openJobs.every((j) => j.status === "open"));

    const frontendJobs = await listJobs({ categoryId: "cat_frontend" });
    assert.ok(frontendJobs.every((j) => j.categoryId === "cat_frontend"));

    const highBudgetJobs = await listJobs({ minBudget: 250 });
    assert.ok(highBudgetJobs.every((j) => j.budgetMax >= 250));
  });
});
