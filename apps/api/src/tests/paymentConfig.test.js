import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { env } from "../config/env.js";

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

test("POST /api/payments fails in production without Stripe configuration", async () => {
  const previousNodeEnv = env.nodeEnv;
  const previousStripeSecretKey = env.stripeSecretKey;
  env.nodeEnv = "production";
  env.stripeSecretKey = "";

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/payments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: 5000, currency: "usd" })
      });
      const payload = await response.json();

      assert.equal(response.status, 503);
      assert.deepEqual(payload, {
        success: false,
        message: "Stripe is not configured"
      });
    });
  } finally {
    env.nodeEnv = previousNodeEnv;
    env.stripeSecretKey = previousStripeSecretKey;
  }
});
