import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createOAuthState } from "../services/authService.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("register, login, and refresh require real credentials and tokens", async () => {
  await withServer(async (baseUrl) => {
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "dev@example.com",
        password: "secretpass",
        role: "client"
      })
    });
    const registerPayload = await registerResponse.json();

    assert.equal(registerResponse.status, 201);
    assert.equal(registerPayload.success, true);
    assert.equal(registerPayload.data.email, "dev@example.com");
    assert.equal(typeof registerPayload.data.refreshToken, "string");

    const failedLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "dev@example.com",
        password: "wrongpass"
      })
    });
    const failedLoginPayload = await failedLoginResponse.json();

    assert.equal(failedLoginResponse.status, 401);
    assert.deepEqual(failedLoginPayload, {
      success: false,
      message: "Invalid email or password"
    });

    const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken: registerPayload.data.refreshToken
      })
    });
    const refreshPayload = await refreshResponse.json();

    assert.equal(refreshResponse.status, 200);
    assert.equal(refreshPayload.success, true);
    assert.equal(typeof refreshPayload.data.token, "string");
    assert.equal(typeof refreshPayload.data.refreshToken, "string");
  });
});

test("oauth callback rejects missing or replayed state", async () => {
  await withServer(async (baseUrl) => {
    const missingStateResponse = await fetch(`${baseUrl}/api/auth/oauth/github/callback`);
    const missingStatePayload = await missingStateResponse.json();

    assert.equal(missingStateResponse.status, 401);
    assert.deepEqual(missingStatePayload, {
      success: false,
      message: "jwt must be provided"
    });

    const state = createOAuthState("github");

    const callbackResponse = await fetch(
      `${baseUrl}/api/auth/oauth/github/callback?state=${encodeURIComponent(state)}`
    );
    const callbackPayload = await callbackResponse.json();

    assert.equal(callbackResponse.status, 200);
    assert.deepEqual(callbackPayload, {
      success: true,
      data: {
        provider: "github",
        status: "callback-received"
      }
    });

    const replayResponse = await fetch(
      `${baseUrl}/api/auth/oauth/github/callback?state=${encodeURIComponent(state)}`
    );
    const replayPayload = await replayResponse.json();

    assert.equal(replayResponse.status, 401);
    assert.deepEqual(replayPayload, {
      success: false,
      message: "Invalid OAuth state"
    });
  });
});
