import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../app.js";

const protectedRoutes = [
  "/api/users",
  "/api/payments",
  "/api/notifications"
];

for (const route of protectedRoutes) {
  test(`POST ${route} rejects unauthenticated requests`, async () => {
    const app = createApp();
    const server = app.listen(0);

    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    try {
      const { port } = server.address();
      const response = await fetch(`http://127.0.0.1:${port}${route}`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({})
      });
      const payload = await response.json();

      assert.equal(response.status, 401);
      assert.deepEqual(payload, {
        success: false,
        message: "Unauthorized"
      });
    } finally {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
}
