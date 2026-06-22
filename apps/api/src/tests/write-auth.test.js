import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/proposals requires authentication", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "job_1", freelancerId: "usr_spoof" })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/proposals uses authenticated user as freelancer", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_auth" });
    const response = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        id: "prp_spoof",
        jobId: "job_1",
        freelancerId: "usr_spoof",
        coverLetter: "Scoped delivery plan"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.jobId, "job_1");
    assert.equal(payload.data.coverLetter, "Scoped delivery plan");
    assert.equal(payload.data.freelancerId, "usr_auth");
    assert.match(payload.data.id, /^prp_/);
    assert.notEqual(payload.data.id, "prp_spoof");
  });
});

test("POST /api/reviews requires authentication", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contractId: "ctr_1", reviewerId: "usr_spoof" })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/reviews uses authenticated user as reviewer", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_auth" });
    const response = await fetch(`${baseUrl}/api/reviews`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        id: "rev_spoof",
        contractId: "ctr_1",
        reviewerId: "usr_spoof",
        rating: 5
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.contractId, "ctr_1");
    assert.equal(payload.data.rating, 5);
    assert.equal(payload.data.reviewerId, "usr_auth");
    assert.match(payload.data.id, /^rev_/);
    assert.notEqual(payload.data.id, "rev_spoof");
  });
});

test("POST /api/uploads requires authentication", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/uploads`, { method: "POST" });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/uploads records the authenticated uploader", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_auth" });
    const body = new FormData();
    body.set("file", new Blob(["hello"], { type: "text/plain" }), "note.txt");

    const response = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload, {
      success: true,
      data: {
        filename: "note.txt",
        status: "uploaded",
        uploaderId: "usr_auth"
      }
    });
  });
});
