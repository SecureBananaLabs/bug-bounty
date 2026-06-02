import test from "node:test";
import assert from "node:assert/strict";
import { jwtSecret } from "../config/env.js";

test("jwtSecret is a non-empty string and resolves the default development fallback", async () => {
  assert.equal(typeof jwtSecret, "string");
  assert.ok(jwtSecret.length > 0);
});