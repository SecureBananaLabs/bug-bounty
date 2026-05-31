import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function cookieFlags(response) {
  const header = response.headers.get("set-cookie");
  assert.ok(header, "expected auth response to set a cookie");
  return header;
}

function assertSecureAccessCookie(response) {
  const header = cookieFlags(response);
  assert.match(header, /accessToken=/);
  assert.match(header, /HttpOnly/i);
  assert.match(header, /Secure/i);
  assert.match(header, /SameSite=Strict/i);
}

function assertNoBodyToken(payload) {
  assert.equal(payload.data.token, undefined);
  assert.doesNotMatch(JSON.stringify(payload), /eyJ/);
}

test("auth endpoints set httpOnly cookies instead of returning token bodies", async () => {
  await withServer(async (baseUrl) => {
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "client@example.com",
        password: "correct horse battery staple",
        role: "client"
      })
    });
    const registerPayload = await registerResponse.json();

    assert.equal(registerResponse.status, 201);
    assertSecureAccessCookie(registerResponse);
    assertNoBodyToken(registerPayload);
    assert.equal(registerPayload.data.email, "client@example.com");

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "client@example.com",
        password: "correct horse battery staple"
      })
    });
    const loginPayload = await loginResponse.json();

    assert.equal(loginResponse.status, 200);
    assertSecureAccessCookie(loginResponse);
    assertNoBodyToken(loginPayload);
    assert.equal(loginPayload.data.email, "client@example.com");

    const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST"
    });
    const refreshPayload = await refreshResponse.json();

    assert.equal(refreshResponse.status, 200);
    assertSecureAccessCookie(refreshResponse);
    assert.deepEqual(refreshPayload, {
      success: true,
      data: { refreshed: true }
    });
  });
});

test("protected routes accept the auth cookie", async () => {
  await withServer(async (baseUrl) => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "client@example.com",
        password: "correct horse battery staple"
      })
    });
    const cookie = cookieFlags(loginResponse);

    const metricsResponse = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: { cookie }
    });
    const metricsPayload = await metricsResponse.json();

    assert.equal(metricsResponse.status, 200);
    assert.equal(metricsPayload.success, true);
    assert.equal(metricsPayload.data.openJobs, 42);
  });
});

test("logout clears the auth cookie", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST"
    });
    const payload = await response.json();
    const header = cookieFlags(response);

    assert.equal(response.status, 200);
    assert.match(header, /accessToken=/);
    assert.match(header, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/i);
    assert.match(header, /HttpOnly/i);
    assert.match(header, /Secure/i);
    assert.match(header, /SameSite=Strict/i);
    assert.deepEqual(payload, {
      success: true,
      data: { loggedOut: true }
    });
  });
});
