import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    return await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

test("POST /api/proposals with valid payload returns 201 and creates proposal", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_98765",
        coverLetter: "I have 5+ years of experience with Node.js and TypeScript architectures.",
        bidAmount: 450,
        estimatedDuration: "5 days",
        freelancerId: "fl_12345"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.jobId, "job_98765");
    assert.equal(body.data.bidAmount, 450);
    assert.ok(body.data.id.startsWith("prp_"));
  });
});

test("POST /api/proposals with minimal valid payload returns 201", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_11111",
        coverLetter: "Experienced engineer ready to implement this specification immediately.",
        bidAmount: 300
      })
    });

    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.jobId, "job_11111");
    assert.equal(body.data.bidAmount, 300);
  });
});

test("POST /api/proposals rejects missing jobId with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coverLetter: "Experienced engineer ready to implement this specification.",
        bidAmount: 300
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
    assert.ok(Array.isArray(body.issues));
  });
});

test("POST /api/proposals rejects too short coverLetter with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_22222",
        coverLetter: "Hi",
        bidAmount: 200
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });
});

test("POST /api/proposals rejects negative or zero bidAmount with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    for (const badBid of [-100, 0]) {
      const res = await fetch(`${baseUrl}/api/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: "job_33333",
          coverLetter: "Experienced engineer ready to implement this specification.",
          bidAmount: badBid
        })
      });

      const body = await res.json();
      assert.equal(res.status, 400);
      assert.equal(body.success, false);
      assert.equal(body.message, "Validation failed");
    }
  });
});

test("POST /api/proposals rejects non-numeric bidAmount with 400 Bad Request", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_44444",
        coverLetter: "Experienced engineer ready to implement this specification.",
        bidAmount: "five_hundred"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });
});

test("POST /api/proposals rejects unknown extra properties with 400 (strict schema)", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: "job_55555",
        coverLetter: "Experienced engineer ready to implement this specification.",
        bidAmount: 300,
        unauthorizedField: "malicious_injection"
      })
    });

    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
  });
});
