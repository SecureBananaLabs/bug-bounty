import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/payments preserves jobId in response", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1000, currency: "usd", jobId: "job_12345" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.ok(payload.success);
    assert.equal(payload.data.jobId, "job_12345");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
