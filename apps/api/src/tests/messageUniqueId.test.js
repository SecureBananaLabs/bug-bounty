import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

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

test("POST /api/messages gives every message an id in the same tick", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_9", role: "freelancer" });
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const first = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ jobId: "job_1", body: "first" })
  });
  const firstPayload = await first.json();

  const second = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ jobId: "job_1", body: "second" })
  });
  const secondPayload = await second.json();

  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.match(firstPayload.data.id, /^msg_/);
  assert.notEqual(firstPayload.data.id, secondPayload.data.id);

  const listed = await fetch(`http://127.0.0.1:${port}/api/messages`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listedPayload = await listed.json();

  const ids = listedPayload.data.map((message) => message.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes(secondPayload.data.id));

  await close(server);
});
