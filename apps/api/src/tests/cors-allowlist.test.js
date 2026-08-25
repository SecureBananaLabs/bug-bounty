import test from "node:test";
import assert from "node:assert/strict";

async function withServer(run) {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousCorsOrigins = process.env.CORS_ORIGINS;

  try {
    const { createApp } = await import(`../app.js?cors=${Date.now()}`);
    const app = createApp();
    const server = app.listen(0);

    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    try {
      const { port } = server.address();
      await run(port);
    } finally {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
    process.env.CORS_ORIGINS = previousCorsOrigins;
  }
}

test("CORS allows configured origins in production", async () => {
  process.env.NODE_ENV = "production";
  process.env.CORS_ORIGINS = "https://allowed.example";

  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: {
        Origin: "https://allowed.example"
      }
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "https://allowed.example");
  });
});

test("CORS denies unlisted origins in production", async () => {
  process.env.NODE_ENV = "production";
  process.env.CORS_ORIGINS = "https://allowed.example";

  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: {
        Origin: "https://blocked.example"
      }
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });
});
