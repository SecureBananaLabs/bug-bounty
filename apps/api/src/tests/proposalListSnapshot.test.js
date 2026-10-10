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

test("GET /api/proposals is not reshaped by a caller mutating the list", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_11", role: "freelancer" });
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const created = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers,
    body: JSON.stringify({ jobId: "job_1", amount: 250 })
  });
  const createdPayload = await created.json();

  assert.equal(created.status, 201);

  const first = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const firstPayload = await first.json();
  const firstList = firstPayload.data;

  // A caller trimming its own copy must not shrink the stored list.
  firstList.pop();

  const second = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const secondPayload = await second.json();

  assert.equal(secondPayload.data.length, firstList.length + 1);
  assert.equal(secondPayload.data.at(-1).id, createdPayload.data.id);

  await close(server);
});
