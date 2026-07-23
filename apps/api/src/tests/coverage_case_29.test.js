import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("registration rejects malformed email format case 29", async (t) => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "malformed_email_29_at_domain",
        password: "password123",
        fullName: "User 29"
      })
    });
    assert.equal(response.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
