import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withApiServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("GET /health only emits CORS allow header for configured frontend origin", async () => {
  const previousOrigin = process.env.FRONTEND_ORIGIN;
  process.env.FRONTEND_ORIGIN = "https://app.example.com";

  try {
    await withApiServer(async (baseUrl) => {
      const trusted = await fetch(`${baseUrl}/health`, {
        headers: { Origin: "https://app.example.com" }
      });
      const untrusted = await fetch(`${baseUrl}/health`, {
        headers: { Origin: "https://evil.example" }
      });

      assert.equal(trusted.status, 200);
      assert.equal(trusted.headers.get("access-control-allow-origin"), "https://app.example.com");
      assert.equal(untrusted.status, 200);
      assert.equal(untrusted.headers.get("access-control-allow-origin"), null);
    });
  } finally {
    if (previousOrigin === undefined) {
      delete process.env.FRONTEND_ORIGIN;
    } else {
      process.env.FRONTEND_ORIGIN = previousOrigin;
    }
  }
});

test("GET /health does not reflect origins when no frontend origin is configured", async () => {
  const previousOrigin = process.env.FRONTEND_ORIGIN;
  delete process.env.FRONTEND_ORIGIN;

  try {
    await withApiServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`, {
        headers: { Origin: "https://evil.example" }
      });

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("access-control-allow-origin"), null);
    });
  } finally {
    if (previousOrigin !== undefined) {
      process.env.FRONTEND_ORIGIN = previousOrigin;
    }
  }
});
