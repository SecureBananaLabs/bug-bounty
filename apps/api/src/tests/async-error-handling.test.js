import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";

test("asyncHandler catches rejected promise and forwards to next", async () => {
  const app = express();
  const router = express.Router();

  const failingHandler = async () => {
    throw new Error("Test error");
  };

  router.get("/test", asyncHandler(failingHandler));
  app.use(router);

  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
  });

  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/test`);

  assert.equal(response.status, 500);
  const body = await response.json();
  assert.equal(body.error, "Test error");

  await new Promise((resolve) => server.close(resolve));
});

test("asyncHandler passes resolved value through", async () => {
  const app = express();
  const router = express.Router();

  const successHandler = async (req, res) => {
    res.json({ success: true });
  };

  router.get("/test", asyncHandler(successHandler));
  app.use(router);

  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/test`);

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.success, true);

  await new Promise((resolve) => server.close(resolve));
});
