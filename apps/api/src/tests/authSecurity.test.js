import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postJson(baseUrl, path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/auth/register rejects admin role self-assignment", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/auth/register", {
      email: "admin-seeker@example.com",
      password: "correct-horse",
      role: "admin"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid registration payload");
  });
});

test("POST /api/auth/register still allows public client and freelancer roles", async () => {
  await withServer(async (baseUrl) => {
    const clientResponse = await postJson(baseUrl, "/api/auth/register", {
      email: "client@example.com",
      password: "correct-horse"
    });
    const clientPayload = await clientResponse.json();

    assert.equal(clientResponse.status, 201);
    assert.equal(clientPayload.success, true);
    assert.equal(clientPayload.data.role, "client");

    const freelancerResponse = await postJson(baseUrl, "/api/auth/register", {
      email: "freelancer@example.com",
      password: "correct-horse",
      role: "freelancer"
    });
    const freelancerPayload = await freelancerResponse.json();

    assert.equal(freelancerResponse.status, 201);
    assert.equal(freelancerPayload.success, true);
    assert.equal(freelancerPayload.data.role, "freelancer");
  });
});

test("POST /api/auth/refresh reissues a token for the submitted subject", async () => {
  await withServer(async (baseUrl) => {
    const originalToken = signAccessToken({
      sub: "usr_refresh_owner",
      role: "freelancer"
    });

    const response = await postJson(baseUrl, "/api/auth/refresh", {
      token: originalToken
    });
    const payload = await response.json();
    const decoded = verifyAccessToken(payload.data.token);

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(decoded.sub, "usr_refresh_owner");
    assert.equal(decoded.role, "freelancer");
  });
});

test("POST /api/auth/refresh requires a token in the request body", async () => {
  await withServer(async (baseUrl) => {
    const response = await postJson(baseUrl, "/api/auth/refresh", {});
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Refresh token is required");
  });
});
