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
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("proposal routes require auth for read and write", async () => {
  await withServer(async (baseUrl) => {
    const unauthorizedGet = await fetch(`${baseUrl}/api/proposals`);
    assert.equal(unauthorizedGet.status, 401);

    const unauthorizedPost = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "job_1", amount: 100 })
    });
    assert.equal(unauthorizedPost.status, 401);

    const token = signAccessToken({ sub: "user_1", role: "client" });

    const authorizedPost = await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ jobId: "job_1", amount: 100 })
    });

    assert.equal(authorizedPost.status, 201);
    const created = await authorizedPost.json();
    assert.equal(created.success, true);
    assert.equal(created.data.jobId, "job_1");

    const authorizedGet = await fetch(`${baseUrl}/api/proposals`, {
      headers: { authorization: `Bearer ${token}` }
    });

    assert.equal(authorizedGet.status, 200);
    const listed = await authorizedGet.json();
    assert.equal(listed.success, true);
    assert.ok(Array.isArray(listed.data));
    assert.equal(listed.data.length, 1);
  });
});
