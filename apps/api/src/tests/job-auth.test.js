import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

const jobPayload = {
  title: "Build landing page",
  description: "Create a polished landing page for a new service.",
  budgetMin: 500,
  budgetMax: 1200,
  categoryId: "cat_web",
  skills: ["nextjs"]
};

test("POST /api/jobs requires authentication", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const unauthorizedResponse = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jobPayload)
  });
  const unauthorizedPayload = await unauthorizedResponse.json();

  assert.equal(unauthorizedResponse.status, 401);
  assert.deepEqual(unauthorizedPayload, {
    success: false,
    message: "Unauthorized"
  });

  const token = signAccessToken({ sub: "usr_client", role: "client" });
  const authorizedResponse = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(jobPayload)
  });
  const authorizedPayload = await authorizedResponse.json();

  assert.equal(authorizedResponse.status, 201);
  assert.equal(authorizedPayload.success, true);
  assert.equal(authorizedPayload.data.title, jobPayload.title);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
