import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(app, callback) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("development CORS reflects browser origins by default", async () => {
  const app = createApp({ nodeEnv: "development", corsOrigins: [] });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { Origin: "https://local.example" }
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "https://local.example");
  });
});

test("production CORS allows configured browser origins", async () => {
  const app = createApp({
    nodeEnv: "production",
    corsOrigins: ["https://app.example.com"]
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { Origin: "https://app.example.com" }
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "https://app.example.com");
  });
});

test("production CORS rejects unconfigured browser origins", async () => {
  const app = createApp({
    nodeEnv: "production",
    corsOrigins: ["https://app.example.com"]
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { Origin: "https://evil.example" }
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
    assert.deepEqual(payload, {
      success: false,
      message: "CORS origin not allowed"
    });
  });
});
