import assert from "node:assert/strict";
import test from "node:test";
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
    return await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(port, path, body, token) {
  return fetch(`http://127.0.0.1:${port}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
}

test("POST routes require authentication", async () => {
  await withServer(async (port) => {
    const responses = await Promise.all([
      postJson(port, "/api/users", { fullName: "Test User" }),
      postJson(port, "/api/notifications", { body: "hello" }),
      postJson(port, "/api/payments", { amount: 1 })
    ]);
    const payloads = await Promise.all(responses.map((response) => response.json()));

    for (const response of responses) {
      assert.equal(response.status, 401);
    }

    for (const payload of payloads) {
      assert.equal(payload.success, false);
      assert.match(payload.message, /unauthorized/i);
    }
  });
});

test("authenticated callers can still create records", async () => {
  await withServer(async (port) => {
    const token = signAccessToken({ sub: "usr_test", role: "client" });
    const response = await postJson(port, "/api/users", { fullName: "Test User" }, token);
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.fullName, "Test User");
  });
});
