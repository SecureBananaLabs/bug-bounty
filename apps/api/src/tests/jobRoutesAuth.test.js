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

const token = signAccessToken({ sub: "usr_1", role: "freelancer" });

test("job routes reject callers without a bearer token", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const anonymous = await fetch(`http://127.0.0.1:${port}/api/jobs`);
  assert.equal(anonymous.status, 401);
  assert.deepEqual(await anonymous.json(), { success: false, message: "Unauthorized" });

  await close(server);
});

test("job routes serve an authenticated caller", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const before = (await (await fetch(`http://127.0.0.1:${port}/api/jobs`, { headers })).json()).data;

  const created = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      title: "Build a landing page",
      description: "A landing page with a signup form",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat_1",
      skills: ["react"]
    })
  });
  assert.equal(created.status, 201);
  const createdPayload = await created.json();
  assert.equal(createdPayload.success, true);
  assert.equal(createdPayload.data.title, "Build a landing page");

  const after = (await (await fetch(`http://127.0.0.1:${port}/api/jobs`, { headers })).json()).data;
  assert.equal(after.length, before.length + 1);

  await close(server);
});
