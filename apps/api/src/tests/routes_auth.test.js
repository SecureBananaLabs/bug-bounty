import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("review, notification, and message routes authentication enforcement", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const endpoints = [
      { path: "/api/reviews", postBody: { rating: 5, comment: "great" } },
      { path: "/api/notifications", postBody: { title: "hi", message: "there" } },
      { path: "/api/messages", postBody: { receiverId: "usr_2", content: "hello" } },
    ];

    for (const ep of endpoints) {
      // 1. Unauthenticated GET returns 401
      const resGetUnauth = await fetch(`${baseUrl}${ep.path}`);
      assert.equal(resGetUnauth.status, 401, `${ep.path} unauth GET should be 401`);

      // 2. Unauthenticated POST returns 401
      const resPostUnauth = await fetch(`${baseUrl}${ep.path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ep.postBody),
      });
      assert.equal(resPostUnauth.status, 401, `${ep.path} unauth POST should be 401`);

      // 3. Authenticated GET returns 200
      const token = signAccessToken({ userId: "usr_1", email: "test@example.com", role: "client" });
      const resGetAuth = await fetch(`${baseUrl}${ep.path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(resGetAuth.status, 200, `${ep.path} auth GET should be 200`);

      // 4. Authenticated POST returns 201
      const resPostAuth = await fetch(`${baseUrl}${ep.path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ep.postBody),
      });
      assert.equal(resPostAuth.status, 201, `${ep.path} auth POST should be 201`);
    }
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
