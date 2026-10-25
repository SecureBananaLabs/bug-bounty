import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function listen(app) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("proposal creation requires authentication while listing stays public", async () => {
  const app = createApp();
  const server = await listen(app);

  try {
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;

    const publicList = await fetch(`${baseUrl}/api/proposals`);
    assert.equal(publicList.status, 200);

    const unauthenticatedCreate = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "job_1", coverLetter: "I can help" })
    });
    const unauthenticatedPayload = await unauthenticatedCreate.json();

    assert.equal(unauthenticatedCreate.status, 401);
    assert.deepEqual(unauthenticatedPayload, {
      success: false,
      message: "Unauthorized"
    });

    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const authenticatedCreate = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ jobId: "job_1", coverLetter: "I can help" })
    });
    const authenticatedPayload = await authenticatedCreate.json();

    assert.equal(authenticatedCreate.status, 201);
    assert.equal(authenticatedPayload.success, true);
    assert.match(authenticatedPayload.data.id, /^prp_\d+$/);
    assert.equal(authenticatedPayload.data.jobId, "job_1");
  } finally {
    await close(server);
  }
});
