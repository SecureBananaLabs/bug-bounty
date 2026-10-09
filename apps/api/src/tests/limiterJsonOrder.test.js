import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test("malformed JSON requests consume the rate limit quota", async () => {
  const { server, port } = await listen(createApp());
  const base = `http://127.0.0.1:${port}`;

  try {
    let status = 200;
    for (let i = 0; i < 201; i += 1) {
      const res = await fetch(`${base}/api/jobs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: '{"title": "oops"'
      });
      status = res.status;
    }

    assert.equal(status, 429);

    const remaining = await fetch(`${base}/health`);
    const header = remaining.headers.get("ratelimit") ?? "";
    assert.match(header, /remaining=0/);
  } finally {
    await close(server);
  }
});
