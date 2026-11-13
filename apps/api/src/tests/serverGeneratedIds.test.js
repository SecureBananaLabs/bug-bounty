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

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return { response, payload: await response.json() };
}

test("record creation endpoints keep server-owned ids", async () => {
  await withServer(async (baseUrl) => {
    const cases = [
      ["/api/users", "usr_", { id: "usr_attacker", email: "owner@example.com" }],
      ["/api/proposals", "prp_", { id: "prp_attacker", jobId: "job_1", amount: 500 }],
      ["/api/reviews", "rev_", { id: "rev_attacker", rating: 5, targetId: "usr_1" }],
      ["/api/messages", "msg_", { id: "msg_attacker", body: "hello", recipientId: "usr_2" }]
    ];

    for (const [path, prefix, body] of cases) {
      const { response, payload } = await postJson(baseUrl, path, body);

      assert.equal(response.status, 201);
      assert.equal(payload.success, true);
      assert.match(payload.data.id, new RegExp(`^${prefix}\\d+$`));
      assert.notEqual(payload.data.id, body.id);
    }
  });
});
