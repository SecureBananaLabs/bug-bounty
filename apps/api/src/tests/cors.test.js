import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("CORS allows configured origins", async () => {
  const previousOrigins = process.env.CORS_ORIGINS;
  process.env.CORS_ORIGINS = "https://app.example.com, https://admin.example.com";

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`, {
        headers: { origin: "https://admin.example.com" }
      });

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("access-control-allow-origin"), "https://admin.example.com");
    });
  } finally {
    if (previousOrigins === undefined) {
      delete process.env.CORS_ORIGINS;
    } else {
      process.env.CORS_ORIGINS = previousOrigins;
    }
  }
});

test("CORS omits allow-origin header for untrusted origins", async () => {
  const previousOrigins = process.env.CORS_ORIGINS;
  process.env.CORS_ORIGINS = "https://app.example.com";

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`, {
        headers: { origin: "https://evil.example.com" }
      });

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("access-control-allow-origin"), null);
    });
  } finally {
    if (previousOrigins === undefined) {
      delete process.env.CORS_ORIGINS;
    } else {
      process.env.CORS_ORIGINS = previousOrigins;
    }
  }
});
