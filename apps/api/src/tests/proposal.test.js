import test, { describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

describe("Proposal API - schema validation and bounds checks", () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      server = null;
    }
  });

  const validProposal = {
    jobId: "job-valid-12345",
    coverLetter: "I am an experienced engineer with strong full-stack skills ready to deliver this project.",
    bidAmount: 1500,
    estimatedDays: 14
  };

  test("valid proposal creation returns 201 with created object", async () => {
    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validProposal)
    });
    const data = await res.json();

    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.id);
    assert.equal(data.data.jobId, validProposal.jobId);
    assert.equal(data.data.coverLetter, validProposal.coverLetter);
    assert.equal(data.data.bidAmount, validProposal.bidAmount);
    assert.equal(data.data.estimatedDays, validProposal.estimatedDays);
  });

  test("missing or empty jobId returns HTTP 400", async () => {
    // Missing jobId
    const { jobId, ...withoutJobId } = validProposal;
    const resMissing = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withoutJobId)
    });
    const dataMissing = await resMissing.json();
    assert.equal(resMissing.status, 400);
    assert.equal(dataMissing.ok, false);
    assert.ok(Array.isArray(dataMissing.issues));

    // Empty jobId
    const resEmpty = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validProposal, jobId: "" })
    });
    const dataEmpty = await resEmpty.json();
    assert.equal(resEmpty.status, 400);
    assert.equal(dataEmpty.ok, false);
    assert.ok(Array.isArray(dataEmpty.issues));

    // Whitespace only jobId
    const resWhitespace = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validProposal, jobId: "   " })
    });
    const dataWhitespace = await resWhitespace.json();
    assert.equal(resWhitespace.status, 400);
    assert.equal(dataWhitespace.ok, false);
    assert.ok(Array.isArray(dataWhitespace.issues));
  });

  test("overlong jobId (>64 chars) returns HTTP 400", async () => {
    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validProposal,
        jobId: "a".repeat(65)
      })
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(Array.isArray(data.issues));
    const issue = data.issues.find((i) => i.path.includes("jobId"));
    assert.ok(issue);
    assert.equal(issue.message, "Job ID too long");
  });

  test("missing or short coverLetter (<10 chars) returns HTTP 400", async () => {
    // Missing coverLetter
    const { coverLetter, ...withoutCoverLetter } = validProposal;
    const resMissing = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withoutCoverLetter)
    });
    const dataMissing = await resMissing.json();
    assert.equal(resMissing.status, 400);
    assert.equal(dataMissing.ok, false);
    assert.ok(Array.isArray(dataMissing.issues));

    // Short coverLetter (9 chars)
    const resShort = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validProposal, coverLetter: "123456789" })
    });
    const dataShort = await resShort.json();
    assert.equal(resShort.status, 400);
    assert.equal(dataShort.ok, false);
    assert.ok(Array.isArray(dataShort.issues));
  });

  test("overlong coverLetter (>5000 chars) returns HTTP 400", async () => {
    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validProposal,
        coverLetter: "x".repeat(5001)
      })
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(Array.isArray(data.issues));
    const issue = data.issues.find((i) => i.path.includes("coverLetter"));
    assert.ok(issue);
    assert.equal(issue.message, "Cover letter cannot exceed 5000 characters");
  });

  test("negative or zero bidAmount returns HTTP 400", async () => {
    for (const invalidBid of [0, -1, -500]) {
      const res = await fetch(`${baseUrl}/api/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validProposal, bidAmount: invalidBid })
      });
      const data = await res.json();

      assert.equal(res.status, 400, `Expected 400 for bidAmount: ${invalidBid}`);
      assert.equal(data.ok, false);
      assert.ok(Array.isArray(data.issues));
    }
  });

  test("exorbitant bidAmount (>1,000,000) returns HTTP 400", async () => {
    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validProposal,
        bidAmount: 1000000.01
      })
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(Array.isArray(data.issues));
    const issue = data.issues.find((i) => i.path.includes("bidAmount"));
    assert.ok(issue);
    assert.equal(issue.message, "Bid amount cannot exceed 1,000,000");
  });

  test("non-integer or negative estimatedDays returns HTTP 400", async () => {
    for (const invalidDays of [4.5, 0, -10]) {
      const res = await fetch(`${baseUrl}/api/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validProposal, estimatedDays: invalidDays })
      });
      const data = await res.json();

      assert.equal(res.status, 400, `Expected 400 for estimatedDays: ${invalidDays}`);
      assert.equal(data.ok, false);
      assert.ok(Array.isArray(data.issues));
    }
  });

  test("exorbitant estimatedDays (>365 days) returns HTTP 400", async () => {
    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validProposal,
        estimatedDays: 366
      })
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(Array.isArray(data.issues));
    const issue = data.issues.find((i) => i.path.includes("estimatedDays"));
    assert.ok(issue);
    assert.equal(issue.message, "Estimated days cannot exceed 365");
  });

  test("GET /api/proposals returns 200 with array of proposals", async () => {
    const res = await fetch(`${baseUrl}/api/proposals`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
  });
});
