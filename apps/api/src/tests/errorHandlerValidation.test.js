import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test("a rejected body comes back as 400 with the offending fields", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "ab", description: "short", budgetMin: -1 })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /title/);
    assert.match(body.message, /description/);
    assert.match(body.message, /budgetMin/);
  } finally {
    await close(server);
  }
});

test("an unexpected failure still reports a generic server error", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/nope`);
    assert.equal(res.status, 404);
  } finally {
    await close(server);
  }
});
