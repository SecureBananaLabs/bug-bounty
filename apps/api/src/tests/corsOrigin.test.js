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

function restoreCorsOrigin(previous) {
  if (previous === undefined) {
    delete process.env.CORS_ORIGIN;
  } else {
    process.env.CORS_ORIGIN = previous;
  }
}

test("CORS allows the default localhost origin", async () => {
  const previous = process.env.CORS_ORIGIN;
  delete process.env.CORS_ORIGIN;

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`, {
        headers: { Origin: "http://localhost:3000" }
      });

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:3000");
    });
  } finally {
    restoreCorsOrigin(previous);
  }
});

test("CORS omits allow-origin for untrusted origins", async () => {
  const previous = process.env.CORS_ORIGIN;
  delete process.env.CORS_ORIGIN;

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`, {
        headers: { Origin: "https://evil.example" }
      });

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("access-control-allow-origin"), null);
    });
  } finally {
    restoreCorsOrigin(previous);
  }
});

test("CORS allows a configured origin", async () => {
  const previous = process.env.CORS_ORIGIN;
  process.env.CORS_ORIGIN = "https://app.example.com";

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`, {
        headers: { Origin: "https://app.example.com" }
      });

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("access-control-allow-origin"), "https://app.example.com");
    });
  } finally {
    restoreCorsOrigin(previous);
  }
});
