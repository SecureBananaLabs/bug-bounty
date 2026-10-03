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

test("GET /api/search trims valid search queries", async () => {
  const { baseUrl, server } = await listen(createApp());

  const response = await fetch(`${baseUrl}/api/search?q=%20design%20`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.equal(payload.data.query, "design");

  await close(server);
});

test("GET /api/search rejects overly long search queries", async () => {
  const { baseUrl, server } = await listen(createApp());
  const query = "x".repeat(201);

  const response = await fetch(`${baseUrl}/api/search?q=${query}`);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.match(payload.message, /200 characters/);

  await close(server);
});

test("GET /api/search rejects repeated query parameters", async () => {
  const { baseUrl, server } = await listen(createApp());

  const response = await fetch(`${baseUrl}/api/search?q=design&q=backend`);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.match(payload.message, /must be a string/);

  await close(server);
});
