import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { signAccessToken, signRefreshToken, verifyAccessToken } from "../utils/jwt.js";

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

test("POST /api/auth/refresh rejects missing refresh token", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, { success: false, message: "Refresh token is required" });
  });
});

test("POST /api/auth/refresh rejects access tokens", async () => {
  await withServer(async (baseUrl) => {
    const accessToken = signAccessToken({ sub: "usr_existing", role: "client" });
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken: accessToken })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid refresh token" });
  });
});

test("access token verification remains compatible with legacy tokens", () => {
  const legacyToken = jwt.sign({ sub: "usr_existing", role: "client" }, env.jwtSecret, {
    expiresIn: "15m"
  });

  const verified = verifyAccessToken(legacyToken);

  assert.equal(verified.sub, "usr_existing");
  assert.equal(verified.role, "client");
});

test("access token verification rejects refresh tokens", () => {
  const refreshToken = signRefreshToken({ sub: "usr_existing", role: "client" });

  assert.throws(() => verifyAccessToken(refreshToken), /Invalid token type/);
});

test("POST /api/auth/refresh mints access token for a valid refresh token", async () => {
  await withServer(async (baseUrl) => {
    const refreshToken = signRefreshToken({ sub: "usr_existing", role: "client" });
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);

    const verified = verifyAccessToken(payload.data.token);
    assert.equal(verified.sub, "usr_existing");
    assert.equal(verified.role, "client");
  });
});
