import test from "node:test";
import assert from "node:assert/strict";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/auth/refresh", async (t) => {
  // Hoist env variable check
  process.env.JWT_SECRET = "testsecret";
  const { createApp } = await import("../app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  await t.test("rejects unauthenticated refresh requests with 401", async () => {
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST"
    });
    assert.equal(res.status, 401);
  });

  await t.test("accepts authenticated refresh requests and preserves subject identity", async () => {
    const originalToken = signAccessToken({ sub: "usr_custom_123", role: "developer" });
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${originalToken}`
      }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.success);
    assert.ok(body.data.token);

    // Decode and verify the refreshed token
    const { verifyAccessToken } = await import("../utils/jwt.js");
    const decoded = verifyAccessToken(body.data.token);
    assert.equal(decoded.sub, "usr_custom_123");
    assert.equal(decoded.role, "developer");
  });
});
