import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("GET /api/search validates query parameters", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/search`;

  await t.test("accepts valid q parameter", async () => {
    const response = await fetch(`${baseUrl}?q=test`);
    assert.equal(response.status, 200);
  });

  await t.test("accepts missing q parameter and defaults to empty string", async () => {
    const response = await fetch(baseUrl);
    assert.equal(response.status, 200);
  });

  await t.test("trims q parameter with surrounding spaces", async () => {
    const response = await fetch(`${baseUrl}?q=  test  `);
    assert.equal(response.status, 200);
  });

  await t.test("rejects oversized q parameter", async () => {
    const oversizedQ = "a".repeat(201);
    const response = await fetch(`${baseUrl}?q=${oversizedQ}`);
    assert.equal(response.status, 400);
  });

  await t.test("rejects repeated q parameters (array)", async () => {
    const response = await fetch(`${baseUrl}?q=a&q=b`);
    assert.equal(response.status, 400);
  });

  await t.test("rejects object-shaped q parameter", async () => {
    const response = await fetch(`${baseUrl}?q[a]=1`);
    assert.equal(response.status, 400);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
