"use strict";

const jobService = require("../services/jobService");

// Regression coverage for issue #10846: job IDs were built from Date.now()
// alone, so two jobs created within the same millisecond collided.
describe("jobService job ID generation", () => {
  const FIXED_TIMESTAMP = 1724332800000; // 2024-08-22T12:00:00.000Z
  let originalDateNow;

  beforeEach(() => {
    originalDateNow = Date.now;
    // Freeze the clock so every ID below is generated in the exact same
    // millisecond — deterministically reproduces the collision scenario.
    Date.now = () => FIXED_TIMESTAMP;
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  it("generates distinct IDs for same-millisecond generation", () => {
    const COUNT = 200;
    const ids = new Set();

    for (let i = 0; i < COUNT; i += 1) {
      ids.add(jobService.generateJobId());
    }

    // The old `job_${Date.now()}` implementation would produce size 1 here.
    expect(ids.size).toBe(COUNT);
  });

  it("keeps the job_ prefix and embeds the creation timestamp", () => {
    const id = jobService.generateJobId();

    expect(id.startsWith("job_")).toBe(true);
    expect(id).toMatch(/^job_\d+_[0-9a-f]{12}$/);
    expect(id).toContain(String(FIXED_TIMESTAMP));
  });

  it("assigns unique IDs to jobs created in the same millisecond", async () => {
    const COUNT = 50;
    const ids = new Set();

    for (let i = 0; i < COUNT; i += 1) {
      const result = jobService.createJob({
        title: `Same millisecond job ${i}`,
        description: "regression test payload",
      });
      const job =
        result && typeof result.then === "function" ? await result : result;

      expect(job.id.startsWith("job_")).toBe(true);
      ids.add(job.id);
    }

    expect(ids.size).toBe(COUNT);
  });
});
