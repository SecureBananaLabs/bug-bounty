import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("Registration ID consistency check", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  t.after(() => {
    server.close();
  });

  await t.test("POST /api/auth/register returns matching user id and JWT sub", async () => {
    // Mock Date.now to return different values on consecutive calls to expose the bug
    const originalDateNow = Date.now;
    let calls = 0;
    Date.now = () => {
      calls += 1;
      return 1000000000000 + calls;
    };

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test_register@example.com",
          password: "secure_password",
          role: "client"
        })
      });
      assert.equal(response.status, 201);
      const result = await response.json();
      assert.equal(result.success, true);

      const { id, token } = result.data;
      assert.ok(id);
      assert.ok(token);

      const decoded = verifyAccessToken(token);
      assert.equal(decoded.sub, id, `Mismatch: sub is ${decoded.sub} but id is ${id}`);
    } finally {
      Date.now = originalDateNow;
    }
  });
});
