import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/jobs requires authentication", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  try {
    const noAuth = await fetch(`${base}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "No-auth job", budget: 100 }),
    });
    const noAuthPayload = await noAuth.json();
    assert.equal(noAuth.status, 401);
    assert.equal(noAuthPayload.success, false);
    assert.equal(typeof noAuthPayload.message, "string");

    const badToken = await fetch(`${base}/api/jobs`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer not.a.real.jwt",
      },
      body: JSON.stringify({ title: "Bad-token job", budget: 100 }),
    });
    const badTokenPayload = await badToken.json();
    assert.equal(badToken.status, 401);
    assert.equal(badTokenPayload.success, false);
  } finally {
    await new Promise((r) => server.close(() => r()));
  }
});

test("GET /api/jobs still works without authentication", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address();

  try {
    const list = await fetch(`http://127.0.0.1:${port}/api/jobs`);
    assert.equal(list.status, 200);
  } finally {
    await new Promise((r) => server.close(() => r()));
  }
});
