import test, { describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

describe("Proposal API - Proposals endpoint validation and bounds", () => {
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

  test("Test 1: Valid proposal creation returns 201 with created object", async () => {
    const payload = {
      jobId: "job_001",
      coverLetter: "I am an experienced engineer ready to deliver this project with high quality.",
      bidAmount: 1500,
      estimatedDays: 14
    };

    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    assert.equal(res.status, 201);
    assert.equal(data.success, true);
    assert.ok(data.data.id);
    assert.equal(data.data.jobId, payload.jobId);
    assert.equal(data.data.coverLetter, payload.coverLetter);
    assert.equal(data.data.bidAmount, payload.bidAmount);
    assert.equal(data.data.estimatedDays, payload.estimatedDays);
  });

  test("Test 2: Missing jobId returns HTTP 400", async () => {
    const payload = {
      coverLetter: "I am an experienced engineer ready to deliver this project with high quality.",
      bidAmount: 1500,
      estimatedDays: 14
    };

    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
  });

  test("Test 3: Short coverLetter (< 10 chars) returns HTTP 400", async () => {
    const payload = {
      jobId: "job_001",
      coverLetter: "Too short",
      bidAmount: 1500,
      estimatedDays: 14
    };

    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
  });

  test("Test 4: Missing bidAmount returns HTTP 400", async () => {
    const payload = {
      jobId: "job_001",
      coverLetter: "I am an experienced engineer ready to deliver this project with high quality.",
      estimatedDays: 14
    };

    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
  });

  test("Test 5: Negative bidAmount returns HTTP 400", async () => {
    const payload = {
      jobId: "job_001",
      coverLetter: "I am an experienced engineer ready to deliver this project with high quality.",
      bidAmount: -50,
      estimatedDays: 14
    };

    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
  });

  test("Test 6: bidAmount exceeding 1,000,000 returns HTTP 400", async () => {
    const payload = {
      jobId: "job_001",
      coverLetter: "I am an experienced engineer ready to deliver this project with high quality.",
      bidAmount: 1000000.01,
      estimatedDays: 14
    };

    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
  });

  test("Test 7: Non-integer or negative estimatedDays returns HTTP 400", async () => {
    for (const invalidDays of [4.5, -2, 0]) {
      const payload = {
        jobId: "job_001",
        coverLetter: "I am an experienced engineer ready to deliver this project with high quality.",
        bidAmount: 500,
        estimatedDays: invalidDays
      };

      const res = await fetch(`${baseUrl}/api/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      assert.equal(res.status, 400, `Expected HTTP 400 for estimatedDays: ${invalidDays}`);
      assert.equal(data.ok, false);
      assert.ok(data.error);
      assert.ok(Array.isArray(data.issues));
    }
  });

  test("Test 8: estimatedDays exceeding 365 returns HTTP 400", async () => {
    const payload = {
      jobId: "job_001",
      coverLetter: "I am an experienced engineer ready to deliver this project with high quality.",
      bidAmount: 500,
      estimatedDays: 366
    };

    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    assert.equal(res.status, 400);
    assert.equal(data.ok, false);
    assert.ok(data.error);
    assert.ok(Array.isArray(data.issues));
  });

  test("Test 9: GET /api/proposals returns 200 with array of proposals", async () => {
    const res = await fetch(`${baseUrl}/api/proposals`);
    const data = await res.json();

    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.data));
  });
});
