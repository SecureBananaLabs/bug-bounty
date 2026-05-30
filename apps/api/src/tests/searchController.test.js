import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("search input validation", async () => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address();

  try {
    // Empty query → 200 (defaults to "")
    {
      const res = await fetch(`http://127.0.0.1:${port}/api/search`);
      assert.equal(res.status, 200, "empty query should get 200");
    }

    // Short query → 200
    {
      const res = await fetch(`http://127.0.0.1:${port}/api/search?q=react`);
      assert.equal(res.status, 200, "short query should get 200");
    }

    // Overly long query → 400
    {
      const longQ = "a".repeat(201);
      const res = await fetch(`http://127.0.0.1:${port}/api/search?q=${longQ}`);
      assert.equal(res.status, 400, "query >200 chars should get 400");
      const body = await res.json();
      assert.equal(body.success, false);
    }
  } finally {
    await new Promise((r) => server.close(r));
  }
});
