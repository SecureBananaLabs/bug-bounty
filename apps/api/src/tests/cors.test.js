import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "production";
process.env.CORS_ORIGINS = "http://localhost:3000,https://app.freelanceflow.com";

const { createApp } = await import("../app.js");

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

test("CORS: allowlisted origin passes with 200", async () => {
  const server = await startServer();
  try {
    const res = await fetch(`${server.baseUrl}/health`, {
      headers: { origin: "http://localhost:3000" },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
  } finally {
    await server.close();
  }
});

test("CORS: unknown origin is rejected in production with 403", async () => {
  const server = await startServer();
  try {
    const res = await fetch(`${server.baseUrl}/health`, {
      headers: { origin: "https://attacker.example.com" },
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Not allowed by CORS");
  } finally {
    await server.close();
  }
});
