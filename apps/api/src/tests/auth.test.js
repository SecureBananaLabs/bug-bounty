import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/auth/register rejects admin role self-assignment", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();

  // Test 1: Admin self-assignment rejected
  const resAdmin = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "attacker@test.com",
      password: "Password123!",
      role: "admin"
    })
  });

  assert.equal(resAdmin.status, 400);
  const dataAdmin = await resAdmin.json();
  assert.equal(dataAdmin.success, false);

  // Test 2: Standard freelancer registration accepted
  const resFreelancer = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "valid@test.com",
      password: "Password123!",
      role: "freelancer"
    })
  });

  assert.equal(resFreelancer.status, 201);
  const dataFreelancer = await resFreelancer.json();
  assert.equal(dataFreelancer.data.role, "freelancer");

  await new Promise((resolve) => server.close(resolve));
});
