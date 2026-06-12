import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@freelanceflow/db";

test("@freelanceflow/db resolves through the workspace package entrypoint", () => {
  assert.equal(typeof PrismaClient, "function");
});
