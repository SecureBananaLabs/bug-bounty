import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { env } from "../config/env.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/payments rejects production requests without Stripe configuration", async () => {
  const originalNodeEnv = env.nodeEnv;
  const originalStripeSecretKey = env.stripeSecretKey;

  env.nodeEnv = "production";
  env.stripeSecretKey = "";

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/payments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: 2500, currency: "usd" })
      });
      const payload = await response.json();

      assert.equal(response.status, 503);
      assert.deepEqual(payload, {
        success: false,
        message: "Payment provider is not configured"
      });
    });
  } finally {
    env.nodeEnv = originalNodeEnv;
    env.stripeSecretKey = originalStripeSecretKey;
  }
});
