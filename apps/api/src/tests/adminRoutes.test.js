import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

// Run all assertions against a single server instance to avoid
// port-binding races with Node test runner concurrency.
test("admin routes authorization", async () => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address();

  try {
    // 1. No auth → 401
    {
      const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`);
      assert.equal(res.status, 401, "no token should get 401");
    }

    // 2. Client token → 403
    {
      const token = signAccessToken({ sub: "usr_client", role: "client" });
      const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.equal(res.status, 403, "client role should get 403");
    }

    // 3. Admin token → 200
    {
      const token = signAccessToken({ sub: "usr_admin", role: "admin" });
      const res = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.equal(res.status, 200, "admin role should get 200");
    }
  } finally {
    await new Promise((r) => server.close(r));
  }
});
