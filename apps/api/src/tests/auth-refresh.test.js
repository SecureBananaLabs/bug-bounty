import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";
import { request } from "./helpers/request.js";

test("POST /api/auth/refresh requires a refresh token", async () => {
  const response = await request(createApp(), {
    body: {},
    method: "POST",
    path: "/api/auth/refresh"
  });
  const payload = response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(payload, {
    success: false,
    message: "Refresh token is required"
  });
});

test("POST /api/auth/refresh rejects invalid tokens", async () => {
  const response = await request(createApp(), {
    body: { token: "not-a-jwt" },
    method: "POST",
    path: "/api/auth/refresh"
  });
  const payload = response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(payload, {
    success: false,
    message: "Invalid refresh token"
  });
});

test("POST /api/auth/refresh rejects signed tokens missing required claims", async () => {
  const tokens = [
    signAccessToken({ sub: "usr_refresh" }),
    signAccessToken({ role: "client" })
  ];

  for (const token of tokens) {
    const response = await request(createApp(), {
      body: { token },
      method: "POST",
      path: "/api/auth/refresh"
    });
    const payload = response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid refresh token"
    });
  }
});

test("POST /api/auth/refresh preserves the authenticated subject and role", async () => {
  const token = signAccessToken({ sub: "usr_refresh", role: "freelancer" });
  const response = await request(createApp(), {
    body: { token },
    method: "POST",
    path: "/api/auth/refresh"
  });
  const payload = response.json();
  const decoded = verifyAccessToken(payload.data.token);

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(decoded.sub, "usr_refresh");
  assert.equal(decoded.role, "freelancer");
});
