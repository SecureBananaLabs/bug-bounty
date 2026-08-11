import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { signAccessToken } from "../utils/jwt.js";

test("authMiddleware rejects missing Authorization header", async () => {
  const app = express();
  app.use(express.json());
  app.use(authMiddleware);
  app.get("/protected", (req, res) => res.json({ ok: true }));

  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/protected`);
  assert.equal(res.status, 401);

  await new Promise((r) => server.close(r));
});

test("authMiddleware accepts valid Bearer token", async () => {
  const token = signAccessToken({ sub: "usr_test", role: "client" });

  const app = express();
  app.use(express.json());
  app.use(authMiddleware);
  app.get("/protected", (req, res) => res.json({ user: req.user }));

  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/protected`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.user.sub, "usr_test");
  assert.equal(body.user.role, "client");

  await new Promise((r) => server.close(r));
});
