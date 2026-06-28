import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../app.js";

const requestWithOrigin = async (origin) => {
  const app = createApp();
  const server = createServer(app);

  await new Promise((resolve, reject) => {
    server.listen(0, (error) => (error ? reject(error) : resolve()));
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: {
      origin
    }
  });

  const allowOrigin = response.headers.get("access-control-allow-origin");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  return {
    allowOrigin,
    status: response.status
  };
};

test("GET /health allows configured CORS origin", async () => {
  const { allowOrigin, status } = await requestWithOrigin("http://localhost:3000");

  assert.equal(status, 200);
  assert.equal(allowOrigin, "http://localhost:3000");
});

test("GET /health denies unconfigured CORS origin", async () => {
  const { allowOrigin, status } = await requestWithOrigin("http://evil.example");

  assert.equal(status, 200);
  assert.equal(allowOrigin, null);
});
