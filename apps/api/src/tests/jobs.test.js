import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/jobs authentication and authorization flow", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/jobs`;

  const validPayload = {
    title: "Web Developer",
    description: "Build a beautiful website using HTML and CSS",
    budgetMin: 100,
    budgetMax: 500,
    categoryId: "cat_webdev",
    skills: ["html", "css"]
  };

  await t.test("rejects request without authorization header", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(validPayload)
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.message, "Unauthorized");
  });

  await t.test("rejects request with invalid token", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalidtokenhere"
      },
      body: JSON.stringify(validPayload)
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid token");
  });

  await t.test("creates job with valid token and payload", async () => {
    const token = signAccessToken({ id: "user_123", role: "client" });
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(validPayload)
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.ok(body.data.id);
    assert.equal(body.data.title, validPayload.title);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
