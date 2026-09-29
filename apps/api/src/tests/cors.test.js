import test from "node:test";
import assert from "node:assert/strict";

async function withApp(envOverrides, run) {
  const previous = {};
  for (const [key, value] of Object.entries(envOverrides)) {
    previous[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  const { createApp } = await import(`../app.js?case=${Math.random()}`);

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
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("allows an origin present in the allowlist", async () => {
  await withApp(
    { NODE_ENV: "production", CORS_ORIGINS: "https://app.example.com" },
    async (base) => {
      const response = await fetch(`${base}/health`, {
        headers: { Origin: "https://app.example.com" }
      });
      assert.equal(
        response.headers.get("access-control-allow-origin"),
        "https://app.example.com"
      );
    }
  );
});

test("denies an unknown origin in production", async () => {
  await withApp(
    { NODE_ENV: "production", CORS_ORIGINS: "https://app.example.com" },
    async (base) => {
      const response = await fetch(`${base}/health`, {
        headers: { Origin: "https://evil.example.com" }
      });
      assert.equal(response.headers.get("access-control-allow-origin"), null);
    }
  );
});

test("denies all cross-origin requests in production without an allowlist", async () => {
  await withApp({ NODE_ENV: "production", CORS_ORIGINS: undefined }, async (base) => {
    const response = await fetch(`${base}/health`, {
      headers: { Origin: "https://evil.example.com" }
    });
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });
});

test("allows any origin in development without an allowlist", async () => {
  await withApp({ NODE_ENV: "development", CORS_ORIGINS: undefined }, async (base) => {
    const response = await fetch(`${base}/health`, {
      headers: { Origin: "http://localhost:3000" }
    });
    assert.equal(
      response.headers.get("access-control-allow-origin"),
      "http://localhost:3000"
    );
  });
});
