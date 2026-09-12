import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { errorHandler } from "../middleware/errorHandler.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    await run(server.address().port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/auth/login returns 400 with Zod issues for invalid payloads", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "bad", password: "short" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.ok(Array.isArray(payload.issues));
    assert.equal(payload.issues.length, 2);
  });
});

test("POST /api/jobs forwards async validation failures to the global error handler", async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "bad",
        description: "too short",
        budgetMin: -1,
        budgetMax: 10,
        categoryId: "",
        skills: [""]
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Validation failed");
    assert.ok(Array.isArray(payload.issues));
    assert.ok(payload.issues.length >= 4);
  });
});

test("errorHandler keeps returning 500 for non-validation failures", () => {
  let statusCode = null;
  let jsonPayload = null;
  let nextError = null;

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

  errorHandler(new Error("boom"), {}, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, null);
  assert.equal(statusCode, 500);
  assert.deepEqual(jsonPayload, {
    success: false,
    message: "Unexpected server error"
  });
});
