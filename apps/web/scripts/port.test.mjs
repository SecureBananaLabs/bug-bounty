import test from "node:test";
import assert from "node:assert/strict";
import { resolvePort } from "./port.mjs";

test("resolvePort uses the platform PORT value when provided", () => {
  assert.equal(resolvePort({ PORT: "4173" }), "4173");
});

test("resolvePort falls back to 3000 when PORT is unset", () => {
  assert.equal(resolvePort({}), "3000");
});

test("resolvePort falls back to 3000 when PORT is blank", () => {
  assert.equal(resolvePort({ PORT: "   " }), "3000");
});
