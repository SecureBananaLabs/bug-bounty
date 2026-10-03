import test from "node:test";
import assert from "node:assert/strict";
import { listJobs, _resetJobsForTesting, createJob } from "../services/jobService.js";

// These tests share module-level state (the in-memory jobs array), so run
// them serially via a single suite to avoid clobbering.
test("job pagination", { concurrency: false }, async (t) => {
  await t.test("returns full array when no pagination requested (back-compat)", async () => {
    _resetJobsForTesting();
    for (let i = 0; i < 5; i++) await createJob({ title: `j${i}` });
    const all = await listJobs();
    assert.equal(all.length, 5);
  });

  await t.test("slices with limit/offset", async () => {
    _resetJobsForTesting();
    for (let i = 0; i < 30; i++) await createJob({ title: `j${i}` });
    const page = await listJobs({ limit: 20, offset: 0 });
    assert.equal(page.data.length, 20);
    assert.equal(page.pagination.limit, 20);
    assert.equal(page.pagination.offset, 0);
    assert.equal(page.pagination.total, 30);
  });

  await t.test("respects offset", async () => {
    _resetJobsForTesting();
    for (let i = 0; i < 30; i++) await createJob({ title: `j${i}` });
    const page = await listJobs({ limit: 10, offset: 25 });
    assert.equal(page.data.length, 5);
    assert.equal(page.pagination.offset, 25);
    assert.equal(page.pagination.total, 30);
  });

  await t.test("returns empty data when offset >= length", async () => {
    _resetJobsForTesting();
    for (let i = 0; i < 3; i++) await createJob({ title: `j${i}` });
    const page = await listJobs({ limit: 10, offset: 50 });
    assert.equal(page.data.length, 0);
    assert.equal(page.pagination.total, 3);
  });

  await t.test("clamps negative or non-numeric values to safe defaults", async () => {
    _resetJobsForTesting();
    for (let i = 0; i < 3; i++) await createJob({ title: `j${i}` });
    const page = await listJobs({ limit: -5, offset: -10 });
    assert.equal(page.data.length, 3);
    assert.equal(page.pagination.limit, 20);
    assert.equal(page.pagination.offset, 0);
  });
});
