import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

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

async function expectUnauthorized(response) {
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(payload, {
    success: false,
    message: "Unauthorized",
  });
}

test("payment and proposal write/read endpoints require authentication", async () => {
  await withServer(async (baseUrl) => {
    await expectUnauthorized(await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 1000 }),
    }));

    await expectUnauthorized(await fetch(`${baseUrl}/api/proposals`));

    await expectUnauthorized(await fetch(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: "job_1", message: "I can help" }),
    }));
  });
});
