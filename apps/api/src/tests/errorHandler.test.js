import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { errorHandler } from "../middleware/errorHandler.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function stopServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/auth/register rejects malformed JSON with 400", async () => {
  const server = await startServer();

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: "{\"email\":"
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      success: false,
      message: "Invalid JSON body"
    });
  } finally {
    await stopServer(server);
  }
});

test("POST /api/auth/register rejects oversized JSON with 413", async () => {
  const server = await startServer();

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: "demo@example.com",
        password: "a".repeat(150000)
      })
    });

    assert.equal(response.status, 413);
    assert.deepEqual(await response.json(), {
      success: false,
      message: "Request body too large"
    });
  } finally {
    await stopServer(server);
  }
});

test("errorHandler preserves the generic 500 fallback", () => {
  let statusCode = null;
  let jsonPayload = null;
  let nextCalled = false;
  const originalConsoleError = console.error;

  const res = {
    headersSent: false,
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonPayload = payload;
      return this;
    }
  };

  try {
    console.error = () => {};
    errorHandler(new Error("boom"), {}, res, (err) => {
      nextCalled = true;
      assert.equal(err.message, "boom");
    });
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(nextCalled, false);
  assert.equal(statusCode, 500);
  assert.deepEqual(jsonPayload, {
    success: false,
    message: "Unexpected server error"
  });
});
