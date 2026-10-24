import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

const postCases = [
  ["/api/jobs", { title: "Build API", description: "Build a useful API", budgetMin: 1, budgetMax: 2, categoryId: "cat" }],
  ["/api/proposals", { jobId: "job_1", freelancerId: "usr_1", bidAmount: 100 }],
  ["/api/reviews", { reviewerId: "usr_1", revieweeId: "usr_2", rating: 5 }],
  ["/api/messages", { senderId: "usr_1", receiverId: "usr_2", body: "hello" }],
  ["/api/notifications", { userId: "usr_1", title: "Update", body: "hello" }]
];

test("core resource creation routes reject missing bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    for (const [path, body] of postCases) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();

      assert.equal(response.status, 401, path);
      assert.deepEqual(payload, { success: false, message: "Unauthorized" });
    }
  });
});

test("authenticated clients can still create core resources", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_test", role: "client" });

    for (const [path, body] of postCases) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const payload = await response.json();

      assert.equal(response.status, 201, path);
      assert.equal(payload.success, true);
    }
  });
});
