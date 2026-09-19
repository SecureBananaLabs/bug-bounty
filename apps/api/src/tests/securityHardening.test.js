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

async function loginToken(baseUrl) {
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "security@example.com",
      password: "supersecret",
    }),
  });

  const payload = await loginResponse.json();
  return payload.data?.token;
}

test("protected APIs reject unauthenticated callers", async () => {
  await withServer(async (baseUrl) => {
    const token = await loginToken(baseUrl);

    const protectedGetEndpoints = [
      "/api/messages",
      "/api/notifications",
    ];

    for (const path of protectedGetEndpoints) {
      const response = await fetch(`${baseUrl}${path}`);
      const payload = await response.json();
      assert.equal(response.status, 401);
      assert.equal(payload.message, "Unauthorized");

      const postResponse = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "attempt" }),
      });
      const postPayload = await postResponse.json();
      assert.equal(postResponse.status, 401);
      assert.equal(postPayload.message, "Unauthorized");
    }

    const uploadResponse = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
    });
    assert.equal(uploadResponse.status, 401);

    const noFileWithToken = await fetch(`${baseUrl}/api/uploads`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
    });
    const noFilePayload = await noFileWithToken.json();
    assert.equal(noFileWithToken.status, 400);
    assert.equal(noFilePayload.message, "No file provided");
  });
});

test("refresh endpoint validates presence of a refresh token", async () => {
  await withServer(async (baseUrl) => {
    const noToken = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const noTokenPayload = await noToken.json();
    assert.equal(noToken.status, 401);
    assert.equal(noTokenPayload.message, "Missing refresh token");

    const invalidToken = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: "invalid" }),
    });
    const invalidPayload = await invalidToken.json();
    assert.equal(invalidToken.status, 401);
    assert.equal(invalidPayload.message, "Invalid refresh token");

    const token = await loginToken(baseUrl);
    const validRefresh = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: token }),
    });
    const validPayload = await validRefresh.json();

    assert.equal(validRefresh.status, 200);
    assert.equal(typeof validPayload.data?.token, "string");
    assert.ok(validPayload.data.token.length > 0);
  });
});
