import test from "node:test";
import assert from "node:assert/strict";

// env.js reads process.env at module load, so configure before import.
process.env.NODE_ENV = "production";
process.env.CORS_ORIGINS = "http://localhost:3000";

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

test("CORS: unknown origin is rejected in production (403)", async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/health`, {
      headers: { origin: "https://evil.example.com" },
    });
    assert.equal(response.status, 403);
  } finally {
    await server.close();
  }
});

test("CORS: allowlisted origin passes (200)", async () => {
  const server = await startServer();
  try {
    const response = await fetch(`${server.baseUrl}/health`, {
      headers: { origin: "http://localhost:3000" },
    });
    assert.equal(response.status, 200);
  } finally {
    await server.close();
  }
});
