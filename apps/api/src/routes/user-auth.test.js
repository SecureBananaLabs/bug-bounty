import { test } from "node:test";
import assert from "node:assert/strict";
import { userRoutes } from "./userRoutes.js";

test("userRoutes has authMiddleware mounted", () => {
  assert.ok(userRoutes.stack.length > 0, "userRoutes stack must contain middleware");
  const hasAuthMiddleware = userRoutes.stack.some((layer) => layer.handle?.name === "authMiddleware");
  assert.equal(hasAuthMiddleware, true, "userRoutes router must include authMiddleware layer");
});
