import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function fetchFromApp(app, path, options = {}) {
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    return await fetch(`http://127.0.0.1:${port}${path}`, options);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("production API does not allow unconfigured CORS origins", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS;

  process.env.NODE_ENV = "production";
  delete process.env.CORS_ALLOWED_ORIGINS;

  try {
    const response = await fetchFromApp(createApp(), "/health", {
      headers: { Origin: "https://attacker.example" }
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  } finally {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalAllowedOrigins === undefined) {
      delete process.env.CORS_ALLOWED_ORIGINS;
    } else {
      process.env.CORS_ALLOWED_ORIGINS = originalAllowedOrigins;
    }
  }
});

test("production API allows explicitly configured CORS origins", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS;

  process.env.NODE_ENV = "production";
  process.env.CORS_ALLOWED_ORIGINS = "https://app.example.com, https://admin.example.com";

  try {
    const response = await fetchFromApp(createApp(), "/health", {
      headers: { Origin: "https://admin.example.com" }
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "https://admin.example.com");
  } finally {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalAllowedOrigins === undefined) {
      delete process.env.CORS_ALLOWED_ORIGINS;
    } else {
      process.env.CORS_ALLOWED_ORIGINS = originalAllowedOrigins;
    }
  }
});
