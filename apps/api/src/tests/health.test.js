import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";

test("GET /health returns ok payload", async () => {
    const app = createApp();
    const server = app.listen(0);

       await new Promise((resolve, reject) => {
             server.once("listening", resolve);
             server.once("error", reject);
       });

       const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    const payload = await response.json();

       assert.equal(response.status, 200);
    assert.deepEqual(payload, { ok: true, service: "api" });

       await new Promise((resolve, reject) => {
             server.close((error) => (error ? reject(error) : resolve()));
       });
});

test("registerUser signs access token for the returned user id", async () => {
    const result = await registerUser({
          email: "new-user@example.com",
          password: "password123",
          role: "freelancer"
    });

       const decoded = verifyAccessToken(result.token);

       assert.equal(decoded.sub, result.id);
    assert.equal(decoded.role, result.role);
});
