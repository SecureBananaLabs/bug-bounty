import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

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

const routes = [
  "/api/jobs",
  "/api/proposals",
  "/api/reviews",
  "/api/messages",
  "/api/notifications",
  "/api/users" 
];

test("Core endpoints should block unauthenticated POST requests", async () => {
  await withServer(async (baseUrl) => {
    for (const route of routes) {
      const response = await fetch(`${baseUrl}${route}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      assert.equal(response.status, 401, `Expected 401 Unauthorized for POST ${route}, got ${response.status}`);
    }
  });
});
