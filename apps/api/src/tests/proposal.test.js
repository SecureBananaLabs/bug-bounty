import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return {
    base: `http://127.0.0.1:${port}`,
    stop: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

const post = (base, token, body) =>
  fetch(`${base}/api/proposals`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

test("unauthenticated POST /api/proposals is rejected with 401", async () => {
  const { base, stop } = await startServer();
  try {
    const response = await post(base, null, { title: "spam", gigId: "g1" });
    assert.equal(response.status, 401);
  } finally {
    await stop();
  }
});

test("authenticated POST /api/proposals creates a proposal (201)", async () => {
  const { base, stop } = await startServer();
  try {
    const token = signAccessToken({ sub: "usr_freelancer_1", role: "freelancer" });
    const response = await post(base, token, { title: "real proposal", gigId: "g1" });
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.ok(payload.data.id.startsWith("prp_"));
  } finally {
    await stop();
  }
});

test("GET /api/proposals stays public (200)", async () => {
  const { base, stop } = await startServer();
  try {
    const response = await fetch(`${base}/api/proposals`);
    assert.equal(response.status, 200);
  } finally {
    await stop();
  }
});
