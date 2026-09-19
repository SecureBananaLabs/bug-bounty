import http from "node:http";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

describe("Zod error handler", () => {
  it("returns 400 with structured issues for invalid job payload", (t, done) => {
    const app = createApp();
    const server = http.createServer(app);
    server.listen(0, async () => {
      try {
        const { port } = server.address();
        const res = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        });
        const body = await res.json();
        assert.equal(res.status, 400);
        assert.equal(body.success, false);
        assert.equal(body.message, "Validation failed");
        assert.ok(Array.isArray(body.issues));
        assert.ok(body.issues.length > 0);
      } finally {
        server.close();
      }
      done();
    });
  });
});
