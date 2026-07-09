import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

test("Token Refresh Authentication", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_custom_caller_123", role: "expert" });

  t.after(() => {
    server.close();
  });

  await t.test("POST /api/auth/refresh blocks unauthenticated request", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST"
    });
    assert.equal(response.status, 401);
  });

  await t.test("POST /api/auth/refresh issues token containing caller sub and role", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.success, true);

    const decoded = verifyAccessToken(result.data.token);
    assert.equal(decoded.sub, "usr_custom_caller_123");
    assert.equal(decoded.role, "expert");
  });
});
