import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);

  return new Promise((resolve, reject) => {
    server.once("listening", () => {
      resolve({
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        server
      });
    });
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

const validJobPayload = {
  title: "Build an onboarding flow",
  description: "Create a polished onboarding flow for new users.",
  budgetMin: 100,
  budgetMax: 500,
  categoryId: "design",
  skills: ["ux"]
};

test("POST /api/jobs accepts ordered budget ranges", async () => {
  const { baseUrl, server } = await listen(createApp());

  const response = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(validJobPayload)
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.budgetMin, 100);
  assert.equal(payload.data.budgetMax, 500);

  await close(server);
});

test("POST /api/jobs rejects inverted budget ranges", async () => {
  const { baseUrl, server } = await listen(createApp());

  const response = await fetch(`${baseUrl}/api/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...validJobPayload,
      budgetMin: 500,
      budgetMax: 100
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.match(payload.message, /budgetMax/);

  await close(server);
});
