import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("refresh token endpoint", async () => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address();

  try {
    // 1. Missing token → 400
    {
      const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      assert.equal(res.status, 400, "missing token should return 400");
    }

    // 2. Valid token → new token with same subject
    {
      const originalToken = signAccessToken({ sub: "usr_valid", role: "client" });
      const res = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: originalToken })
      });
      assert.equal(res.status, 200, "valid token should return 200");
      const body = await res.json();
      assert.ok(body.success, "response should indicate success");
      assert.ok(body.data.token, "response should contain new token");
    }
  } finally {
    await new Promise((r) => server.close(r));
  }
});
