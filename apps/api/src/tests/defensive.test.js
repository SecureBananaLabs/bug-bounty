import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /api/jobs returns a snapshot that caller cannot mutate", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseURL = `http://127.0.0.1:${port}`;

  await fetch(`${baseURL}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Test Job",
      description: "Test description",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat-1",
      skills: []
    })
  });

  const res = await fetch(`${baseURL}/api/jobs`);
  const data = await res.json();
  const jobsSnapshot = data.data;

  jobsSnapshot.push({ id: "injected" });
  jobsSnapshot.length = 0;

  const res2 = await fetch(`${baseURL}/api/jobs`);
  const data2 = await res2.json();
  const jobsAfter = data2.data;

  assert.equal(jobsAfter.length, 1, "Backing store should not be mutated");
  assert.equal(jobsAfter[0].title, "Test Job", "Original job should still exist");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/jobs returns a snapshot that caller cannot mutate", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseURL = `http://127.0.0.1:${port}`;

  const res = await fetch(`${baseURL}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Snapshot Test Job",
      description: "Testing snapshot isolation",
      budgetMin: 100,
      budgetMax: 500,
      categoryId: "cat-1",
      skills: []
    })
  });
  const created = await res.json();
  const jobSnapshot = created.data;

  jobSnapshot.title = "Mutated Title";
  delete jobSnapshot.id;

  const res2 = await fetch(`${baseURL}/api/jobs`);
  const data2 = await res2.json();
  const jobInStore = data2.data.find((j) => j.title === "Snapshot Test Job");

  assert.equal(jobInStore.title, "Snapshot Test Job", "Stored job should not be mutated");
  assert.ok(jobInStore.id, "Stored job should still have id");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/users returns a snapshot that caller cannot mutate", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseURL = `http://127.0.0.1:${port}`;

  const res = await fetch(`${baseURL}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test@example.com",
      password: "password123",
      fullName: "Test User"
    })
  });
  const created = await res.json();
  const userSnapshot = created.data;

  userSnapshot.email = "hacked@example.com";
  delete userSnapshot.id;

  const res2 = await fetch(`${baseURL}/api/users`);
  const data2 = await res2.json();
  const userInStore = data2.data[0];

  assert.equal(userInStore.email, "test@example.com", "Stored user should not be mutated");
  assert.ok(userInStore.id, "Stored user should still have id");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
