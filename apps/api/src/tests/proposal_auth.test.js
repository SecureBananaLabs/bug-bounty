import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

test("GET /api/proposals is publicly accessible", async () => {
  const server = await startServer();
  try {
    const res = await fetch(`${server.baseUrl}/api/proposals`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
  } finally {
    await server.close();
  }
});

test("POST /api/proposals requires authentication (rejects unauthenticated with 401)", async () => {
  const server = await startServer();
  try {
    const res = await fetch(`${server.baseUrl}/api/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverLetter: "I can deliver this project", price: 500 }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Unauthorized");
  } finally {
    await server.close();
  }
});

test("POST /api/proposals succeeds with valid Bearer token (201 Created)", async () => {
  const server = await startServer();
  try {
    const token = signAccessToken({ sub: "user_freelancer_1", role: "freelancer" });
    const res = await fetch(`${server.baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ coverLetter: "High quality work guaranteed", price: 750 }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.price, 750);
    assert.ok(body.data.id.startsWith("prp_"));
  } finally {
    await server.close();
  }
});
