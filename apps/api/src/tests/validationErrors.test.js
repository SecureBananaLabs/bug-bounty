import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const withTestServer = async (run) => {
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
};

test("validation errors return 400 instead of hanging or returning 500", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "not-an-email",
        password: "short",
        role: "client"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid request payload");
    assert.ok(payload.issues.some((issue) => issue.path === "email"));
    assert.ok(payload.issues.some((issue) => issue.path === "password"));
  });
});
