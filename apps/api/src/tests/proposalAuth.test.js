import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/proposals rejects requests without a token", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverLetter: "anon" })
    });

    assert.equal(response.status, 401);
    assert.equal((await response.json()).message, "Unauthorized");
  });
});

test("POST /api/proposals rejects a malformed token", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer nope"
      },
      body: JSON.stringify({ coverLetter: "anon" })
    });

    assert.equal(response.status, 401);
    assert.equal((await response.json()).message, "Invalid token");
  });
});

test("POST /api/proposals records the authenticated author", async () => {
  await withServer(async (base) => {
    const token = signAccessToken({ sub: "usr_freelancer", role: "freelancer" });
    const response = await fetch(`${base}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ jobId: "job_1", coverLetter: "I can do this" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.authorId, "usr_freelancer");
    assert.match(payload.data.id, /^prp_/);
  });
});

test("POST /api/proposals ignores spoofed ownership fields", async () => {
  await withServer(async (base) => {
    const token = signAccessToken({ sub: "usr_honest", role: "freelancer" });
    const response = await fetch(`${base}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        jobId: "job_2",
        authorId: "usr_someone_else",
        userId: "usr_someone_else",
        id: "prp_forged"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.data.authorId, "usr_honest");
    assert.notEqual(payload.data.id, "prp_forged");
    assert.match(payload.data.id, /^prp_/);
  });
});

test("GET /api/proposals stays public", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/proposals`);

    assert.equal(response.status, 200);
    assert.equal((await response.json()).success, true);
  });
});
