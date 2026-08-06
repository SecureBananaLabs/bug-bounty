import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /proposals preserves server-generated id", async () => {
  const app = createApp();
  // Disable rate limiting for testing
  app._router.stack = app._router.stack.filter(
    (layer) => layer.handle.name !== "rateLimit"
  );
  
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "client-malicious-id",
        title: "Test Proposal",
        description: "Let's see if this works",
      }),
    });

    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.ok(payload.data.id.startsWith("prp_"));
    assert.notEqual(payload.data.id, "client-malicious-id");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
