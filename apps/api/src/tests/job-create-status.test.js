import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/jobs uses server-owned OPEN status and ignores client status", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Build secure API",
      description: "Need security hardening for auth and payment flow",
      budgetMin: 100,
      budgetMax: 300,
      categoryId: "security",
      skills: ["nodejs"],
      status: "CLOSED"
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.data.status, "OPEN");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
