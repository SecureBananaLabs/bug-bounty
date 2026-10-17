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

async function create(port, body) {
  const response = await fetch(`http://127.0.0.1:${port}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  assert.equal(response.status, 201);
  return (await response.json()).data;
}

test("POST /api/notifications generates a unique id per notification", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const first = await create(port, { userId: "usr_1", message: "Job matched" });
  const second = await create(port, { userId: "usr_1", message: "Payment sent" });

  assert.match(first.id, /^ntf_/);
  assert.notEqual(first.id, second.id);
  assert.equal(first.read, false);
  assert.equal(second.message, "Payment sent");

  await close(server);
});

test("GET /api/notifications lists every notification created in one tick", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const before = await fetch(`http://127.0.0.1:${port}/api/notifications`);
  const beforeBody = await before.json();

  await create(port, { userId: "usr_2", message: "One" });
  await create(port, { userId: "usr_2", message: "Two" });

  const after = await fetch(`http://127.0.0.1:${port}/api/notifications`);
  assert.equal(after.status, 200);
  const afterBody = await after.json();

  assert.equal(afterBody.data.length, beforeBody.data.length + 2);

  const ids = afterBody.data.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);

  await close(server);
});
