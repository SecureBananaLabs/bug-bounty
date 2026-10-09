import test from "node:test";
import assert from "node:assert/strict";
import { Router } from "express";
import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { errorHandler } from "../middleware/errorHandler.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function buildApp(handler) {
  const app = express();
  const routes = Router();

  routes.get("/probe", asyncHandler(handler));
  app.use(routes);
  app.use(errorHandler);

  return app;
}

test("a rejected async handler reaches the global error handler", async () => {
  const app = buildApp(async () => {
    throw new Error("boom");
  });
  const { server, port } = await listen(app);

  const response = await fetch(`http://127.0.0.1:${port}/probe`);
  const payload = await response.json();

  assert.equal(response.status, 500);
  assert.deepEqual(payload, { success: false, message: "Unexpected server error" });

  await close(server);
});

test("a resolved async handler still writes its own response", async () => {
  const app = buildApp(async (req, res) => {
    res.status(201).json({ success: true, data: { pong: true } });
  });
  const { server, port } = await listen(app);

  const response = await fetch(`http://127.0.0.1:${port}/probe`);
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(payload, { success: true, data: { pong: true } });

  await close(server);
});

test("asyncHandler keeps the handler bound to the request", async () => {
  const seen = [];
  const handler = asyncHandler(async (req) => {
    seen.push(req.method);
  });

  let nextCalls = 0;
  await handler({ method: "PATCH" }, {}, () => {
    nextCalls += 1;
  });

  assert.deepEqual(seen, ["PATCH"]);
  assert.equal(nextCalls, 0);
});
