import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

// Helper function to setup server
async function setupServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  
  const teardown = async () => {
    if (server.closeAllConnections) server.closeAllConnections();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  };

  return { baseUrl, teardown };
}

test("POST /jobs - valid payload", async () => {
  const { baseUrl, teardown } = await setupServer();
  
  const payload = {
    title: "Fullstack Developer",
    description: "Looking for an experienced developer to build a web app.",
    budgetMin: 50,
    budgetMax: 150,
    categoryId: "tech",
    skills: ["React", "Node.js"]
  };

  const response = await fetch(`${baseUrl}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  
  assert.equal(response.status, 201);
  assert.equal(data.success, true);
  
  await teardown();
});

test("POST /jobs - short title", async () => {
  const { baseUrl, teardown } = await setupServer();
  
  const payload = {
    title: "Dev", // length 3, min 4
    description: "Looking for an experienced developer to build a web app.",
    budgetMin: 50,
    budgetMax: 150,
    categoryId: "tech"
  };

  const response = await fetch(`${baseUrl}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  
  assert.equal(response.status, 400);
  assert.equal(data.success, false);
  assert.ok(Array.isArray(data.message));
  
  await teardown();
});

test("POST /jobs - short description", async () => {
  const { baseUrl, teardown } = await setupServer();
  
  const payload = {
    title: "Fullstack Developer",
    description: "Too short", // length 9, min 10
    budgetMin: 50,
    budgetMax: 150,
    categoryId: "tech"
  };

  const response = await fetch(`${baseUrl}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  
  assert.equal(response.status, 400);
  assert.equal(data.success, false);
  assert.ok(Array.isArray(data.message));
  
  await teardown();
});

test("POST /jobs - negative budget", async () => {
  const { baseUrl, teardown } = await setupServer();
  
  const payload = {
    title: "Fullstack Developer",
    description: "Looking for an experienced developer to build a web app.",
    budgetMin: -10, // negative
    budgetMax: 150,
    categoryId: "tech"
  };

  const response = await fetch(`${baseUrl}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  
  assert.equal(response.status, 400);
  assert.equal(data.success, false);
  assert.ok(Array.isArray(data.message));
  
  await teardown();
});

test("POST /jobs - missing fields", async () => {
  const { baseUrl, teardown } = await setupServer();
  
  const payload = {
    title: "Fullstack Developer"
    // missing description, budgetMin, budgetMax, categoryId
  };

  const response = await fetch(`${baseUrl}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  const data = await response.json();
  
  assert.equal(response.status, 400);
  assert.equal(data.success, false);
  assert.ok(Array.isArray(data.message));
  
  await teardown();
});
