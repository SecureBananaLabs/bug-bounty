import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

test("POST /api/proposals with negative bidAmount returns 400", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: "job_1",
      freelancerId: "usr_1",
      bidAmount: -50,
      coverLetter: "I can do this",
    }),
  });
  assert.equal(res.status, 400);

  const body = await res.json();
  assert.equal(body.success, false);

  await close(server);
});

test("POST /api/proposals with valid payload returns 201", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: "job_1",
      freelancerId: "usr_1",
      bidAmount: 100,
      coverLetter: "I can do this",
    }),
  });
  assert.equal(res.status, 201);

  const body = await res.json();
  assert.equal(body.success, true);

  await close(server);
});
