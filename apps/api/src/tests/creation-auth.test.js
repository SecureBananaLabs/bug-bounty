import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const routes = [
  { path: "/api/reviews", body: { jobId: "job_1", rating: 5, comment: "Great work" } },
  { path: "/api/messages", body: { to: "usr_2", body: "Hello" } },
  { path: "/api/proposals", body: { jobId: "job_1", amount: 250, coverLetter: "I can help" } }
];

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

for (const route of routes) {
  test(`POST ${route.path} requires authentication`, async () => {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}${route.path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(route.body)
      });
      const payload = await response.json();

      assert.equal(response.status, 401);
      assert.deepEqual(payload, { success: false, message: "Unauthorized" });
    });
  });

  test(`POST ${route.path} accepts authenticated creation`, async () => {
    await withServer(async (baseUrl) => {
      const token = signAccessToken({ sub: "usr_test", role: "client" });
      const response = await fetch(`${baseUrl}${route.path}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify(route.body)
      });
      const payload = await response.json();

      assert.equal(response.status, 201);
      assert.equal(payload.success, true);
      assert.match(payload.data.id, /^(rev|msg|prp)_/);
    });
  });
}
