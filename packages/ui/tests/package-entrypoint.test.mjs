import assert from "node:assert/strict";
import test from "node:test";
import * as ui from "@freelanceflow/ui";

test("@freelanceflow/ui exposes its package entrypoint", () => {
  assert.equal(typeof ui.Button, "function");
  assert.equal(typeof ui.Card, "function");
});
