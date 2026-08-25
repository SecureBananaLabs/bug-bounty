import { describe, it, expect } from "vitest";
import { createJob } from "../services/jobService.js";

describe("createJob - server-owned id and status", () => {
  it("should ignore caller-supplied id and status, use server values", async () => {
    const result = await createJob({
      id: "job_malicious",
      status: "completed",
      title: "Build a website",
      description: "Need a landing page",
      budgetMin: 500,
      budgetMax: 1000
    });

    expect(result.id).toMatch(/^job_\d+$/);
    expect(result.id).not.toBe("job_malicious");
    expect(result.status).toBe("open");
    expect(result.title).toBe("Build a website");
    expect(result.budgetMin).toBe(500);
  });
});
