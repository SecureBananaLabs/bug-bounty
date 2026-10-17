import { test } from "node:test";
import assert from "node:assert/strict";
import { paymentRoutes } from "./paymentRoutes.js";

test("paymentRoutes applies authMiddleware requiring JWT token", async () => {
  let middlewareCalled = false;
  let statusSet = 0;

  const req = { headers: {} };
  const res = {
    status(code) {
      statusSet = code;
      return this;
    },
    json(data) {
      return this;
    },
  };

  const next = () => {
    middlewareCalled = true;
  };

  // Find authMiddleware layer in stack
  const authLayer = paymentRoutes.stack.find((layer) => layer.name === "authMiddleware" || layer.handle?.name === "authMiddleware");
  assert.ok(authLayer, "paymentRoutes must include authMiddleware layer");

  await authLayer.handle(req, res, next);

  assert.equal(statusSet, 401, "Unauthenticated request to paymentRoutes must return HTTP 401 Unauthorized");
  assert.equal(middlewareCalled, false, "next() must not be called without valid authorization header");
});
