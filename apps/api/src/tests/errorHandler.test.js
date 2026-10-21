import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { z } from "zod";
import { errorHandler } from "../middleware/errorHandler.js";

test("errorHandler responds with 400 for ZodError", async () => {
  const app = express();
  app.use(express.json());

  const testSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters")
  });

  app.post("/test-validation", (req, res, next) => {
    try {
      testSchema.parse(req.body);
      res.status(200).json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  app.use(errorHandler);

  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/test-validation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "a" }) // Fails validation
  });

  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Validation failed");
  assert.ok(Array.isArray(body.errors));
  assert.equal(body.errors[0].field, "username");

  await new Promise((resolve) => server.close(resolve));
});
