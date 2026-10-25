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

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

const authHeader = {
  authorization: `Bearer ${signAccessToken({ sub: "usr_123", role: "client" })}`,
  "content-type": "application/json"
};

for (const invalidAmount of [0, -5, "12", null]) {
  test(`POST /api/payments rejects invalid amount: ${invalidAmount}`, async () => {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/payments`, {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify({
          amount: invalidAmount,
          currency: "usd"
        })
      });
      const payload = await response.json();

      assert.equal(response.status, 400);
      assert.deepEqual(payload, {
        success: false,
        message: "Amount must be a positive number"
      });
    });
  });
}

test("POST /api/payments accepts positive amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        amount: 125,
        currency: "usd"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 125);
    assert.equal(payload.data.currency, "usd");
  });
});
