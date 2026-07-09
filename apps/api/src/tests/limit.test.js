import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("express.json size limit functionality", async () => {
  const app = createApp();
  const server = app.listen(0);

  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const { port } = server.address();

    // Test payload > 100kb gets rejected with 413
    const largeData = "a".repeat(101 * 1024);
    const largeResponse = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: largeData }),
    });

    assert.equal(largeResponse.status, 413);

    // Test payload <= 100kb is not rejected with 413
    const smallData = "a".repeat(10 * 1024);
    const smallResponse = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: smallData }),
    });

    assert.notEqual(smallResponse.status, 413);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
