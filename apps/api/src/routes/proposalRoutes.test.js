import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { validateCreateProposal } from "../validators/proposal.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("validateCreateProposal requires a positive estimatedDuration", () => {
  assert.equal(validateCreateProposal({}).valid, false);
  assert.equal(validateCreateProposal({ estimatedDuration: 0 }).valid, false);
  assert.equal(validateCreateProposal({ estimatedDuration: -3 }).valid, false);
  assert.equal(validateCreateProposal({ estimatedDuration: "3" }).valid, false);

  const valid = validateCreateProposal({ estimatedDuration: 3, notes: "hi" });
  assert.equal(valid.valid, true);
  assert.equal(valid.data.estimatedDuration, 3);
  assert.equal(valid.data.notes, "hi");
});

test("POST /api/proposals returns 400 when estimatedDuration is missing", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: "job_1", bidAmount: 400 })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "estimatedDuration must be a positive number");

  await close(server);
});

test("POST /api/proposals stores a proposal with estimatedDuration", async () => {
  const app = createApp();
  const { server, port } = await listen(app);

  const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: "job_1", bidAmount: 400, estimatedDuration: 5 })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.estimatedDuration, 5);
  assert.match(payload.data.id, /^prp_/);

  const list = await fetch(`http://127.0.0.1:${port}/api/proposals`);
  const listPayload = await list.json();

  assert.equal(list.status, 200);
  assert.equal(listPayload.data.at(-1).estimatedDuration, 5);

  await close(server);
});
