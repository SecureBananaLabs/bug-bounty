import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(app, run) {
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

test("CORS allows the configured frontend origin", async () => {
  process.env.CORS_ORIGIN = "https://app.example.com";
  try {
    const app = createApp();

    await withServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`, {
        headers: { Origin: "https://app.example.com" }
      });

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("access-control-allow-origin"), "https://app.example.com");
    });
  } finally {
    delete process.env.CORS_ORIGIN;
  }
});

test("CORS omits allow-origin for unlisted origins", async () => {
  process.env.CORS_ORIGIN = "https://app.example.com";
  try {
    const app = createApp();

    await withServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`, {
        headers: { Origin: "https://evil.example.com" }
      });

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("access-control-allow-origin"), null);
    });
  } finally {
    delete process.env.CORS_ORIGIN;
  }
});
