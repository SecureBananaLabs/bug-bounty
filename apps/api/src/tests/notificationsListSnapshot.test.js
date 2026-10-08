import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("GET /api/notifications keeps every stored item after a caller mutates the list", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const headers = { "Content-Type": "application/json" };
  const base = `http://127.0.0.1:${port}`;

  const first = await (await fetch(`${base}/api/notifications`, { headers })).json();
  const before = first.data.length;

  const created = await (
    await fetch(`${base}/api/notifications`, {
      method: "POST",
      headers,
      body: JSON.stringify({ userId: "usr_3", title: "Job shortlisted" })
    })
  ).json();

  assert.equal(created.success, true);

  // Trimming a listing the caller already holds must not shrink the store.
  first.data.pop();

  const second = await (await fetch(`${base}/api/notifications`, { headers })).json();

  assert.equal(second.data.length, before + 1);
  assert.equal(second.data.at(-1).id, created.data.id);

  await close(server);
});
