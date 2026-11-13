import test from "node:test";
import assert from "node:assert/strict";
import { createJob, listJobs } from "./jobService.js";

const seeded = [
  { title: "Build a landing page", description: "Marketing landing page work", budgetMin: 100, budgetMax: 400, categoryId: "cat_web", skills: ["css"] },
  { title: "Design a logo", description: "Brand identity for a coffee shop", budgetMin: 500, budgetMax: 900, categoryId: "cat_design", skills: ["figma"] },
  { title: "Migrate the database", description: "Move a legacy schema onto Postgres", budgetMin: 1200, budgetMax: 2000, categoryId: "cat_web", skills: ["sql"], status: "closed" }
];

test("without filters every job is returned", async () => {
  for (const job of seeded) {
    await createJob(job);
  }

  const all = await listJobs();

  assert.equal(all.length, seeded.length);
});

test("filters by status", async () => {
  const open = await listJobs({ status: "open" });
  const closed = await listJobs({ status: "closed" });

  assert.deepEqual(
    open.map((job) => job.title),
    ["Build a landing page", "Design a logo"]
  );
  assert.deepEqual(
    closed.map((job) => job.title),
    ["Migrate the database"]
  );
});

test("filters by categoryId", async () => {
  const design = await listJobs({ categoryId: "cat_design" });

  assert.deepEqual(
    design.map((job) => job.title),
    ["Design a logo"]
  );
});

test("filters by minBudget against the top of the range", async () => {
  const mid = await listJobs({ minBudget: "500" });

  assert.deepEqual(
    mid.map((job) => job.title),
    ["Design a logo", "Migrate the database"]
  );
});

test("combines all three filters", async () => {
  const matches = await listJobs({
    status: "open",
    categoryId: "cat_web",
    minBudget: "150"
  });

  assert.deepEqual(
    matches.map((job) => job.title),
    ["Build a landing page"]
  );
});

test("ignores empty query parameters", async () => {
  const all = await listJobs({ status: undefined, categoryId: "", minBudget: "" });

  assert.equal(all.length, seeded.length);
});
