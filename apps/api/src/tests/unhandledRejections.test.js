import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("Controllers should catch Zod validation errors and not hang/crash", async () => {
  await withServer(async (baseUrl) => {
    // A request with an empty body to postJob will trigger a ZodError inside the controller.
    // Thanks to catchAsync, this should be caught and returned as a 500 (since the zod error handler is in another branch)
    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    
    // We just want to ensure we get a response (not a hang) and it's a 500 (or 400).
    assert.ok(response.status === 500 || response.status === 400, `Expected 500 or 400, got ${response.status}`);
  });
});
