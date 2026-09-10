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

test("configured trust proxy allows rate limiting proxied requests", async () => {
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => {
    errors.push(args);
  };

  try {
    await withServer(createApp({ trustProxy: 1 }), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`, {
        headers: { "X-Forwarded-For": "203.0.113.10" }
      });

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true, service: "api" });
    });
  } finally {
    console.error = originalError;
  }

  assert.equal(
    errors.some((args) => String(args[0]).includes("ERR_ERL_UNEXPECTED_X_FORWARDED_FOR")),
    false
  );
});
