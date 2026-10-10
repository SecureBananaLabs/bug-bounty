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
  const { port } = server.address();
  try {
    return await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postPayment(port, body) {
  const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return { response, payload: await response.json() };
}

const rejected = [
  ["zero", 0],
  ["negative", -1],
  ["negative fraction", -0.01],
  ["numeric string", "100"],
  ["NaN", Number.NaN],
  ["Infinity", Number.POSITIVE_INFINITY],
  ["null", null],
  ["boolean", true],
  ["missing", undefined]
];

for (const [label, amount] of rejected) {
  test(`POST /api/payments rejects an invalid amount: ${label}`, async () => {
    const body = amount === undefined ? {} : { amount };
    await withServer(async (port) => {
      const { response, payload } = await postPayment(port, body);
      assert.equal(response.status, 400, `expected 400 for ${label}, got ${response.status}`);
      assert.equal(payload.success, false);
    });
  });
}

test("POST /api/payments rejects an unparseable body", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json"
    });
    // express.json() rejects malformed JSON before the route runs; whichever
    // layer handles it, the client must not see a success status.
    assert.ok(response.status >= 400, `expected a 4xx, got ${response.status}`);
  });
});
