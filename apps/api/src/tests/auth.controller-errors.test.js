import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { env } from "../config/env.js";

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

test("POST /api/auth/register routes thrown service errors through the JSON error handler", async () => {
  const originalSecret = env.jwtSecret;
  env.jwtSecret = "";

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
          role: "client"
        })
      });
      const payload = await response.json();

      assert.equal(response.status, 500);
      assert.deepEqual(payload, {
        success: false,
        message: "Unexpected server error"
      });
    });
  } finally {
    env.jwtSecret = originalSecret;
  }
});

test("POST /api/auth/login routes thrown service errors through the JSON error handler", async () => {
  const originalSecret = env.jwtSecret;
  env.jwtSecret = "";

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123"
        })
      });
      const payload = await response.json();

      assert.equal(response.status, 500);
      assert.deepEqual(payload, {
        success: false,
        message: "Unexpected server error"
      });
    });
  } finally {
    env.jwtSecret = originalSecret;
  }
});

test("POST /api/auth/refresh routes thrown service errors through the JSON error handler", async () => {
  const originalSecret = env.jwtSecret;
  env.jwtSecret = "";

  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: "POST"
      });
      const payload = await response.json();

      assert.equal(response.status, 500);
      assert.deepEqual(payload, {
        success: false,
        message: "Unexpected server error"
      });
    });
  } finally {
    env.jwtSecret = originalSecret;
  }
});
