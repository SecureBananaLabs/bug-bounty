import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { env } from "../config/env.js";

async function requestHealth({ origin, nodeEnv, corsOrigins }) {
  const previous = { nodeEnv: env.nodeEnv, corsOrigins: env.corsOrigins };
  env.nodeEnv = nodeEnv;
  env.corsOrigins = corsOrigins;

  const server = createApp().listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const headers = origin ? { Origin: origin } : {};
    return await fetch(`http://127.0.0.1:${port}/health`, { headers });
  } finally {
    Object.assign(env, previous);
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("allowlisted origin gets CORS headers", async () => {
  const response = await requestHealth({
    origin: "https://app.example.com",
    nodeEnv: "production",
    corsOrigins: ["https://app.example.com"]
  });
  assert.equal(response.headers.get("access-control-allow-origin"), "https://app.example.com");
});

test("unknown origin is not allowed in production", async () => {
  const response = await requestHealth({
    origin: "https://evil.example.com",
    nodeEnv: "production",
    corsOrigins: ["https://app.example.com"]
  });
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("production with no allowlist denies cross-origin requests", async () => {
  const response = await requestHealth({
    origin: "https://evil.example.com",
    nodeEnv: "production",
    corsOrigins: []
  });
  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("development with no allowlist stays permissive", async () => {
  const response = await requestHealth({
    origin: "http://localhost:3000",
    nodeEnv: "development",
    corsOrigins: []
  });
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:3000");
});

test("requests without an Origin header still succeed", async () => {
  const response = await requestHealth({ nodeEnv: "production", corsOrigins: [] });
  assert.equal(response.status, 200);
});
