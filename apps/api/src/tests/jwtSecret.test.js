import test from "node:test";
import assert from "node:assert/strict";
import { exec } from "child_process";

test("JWT Secret Validation", async (t) => {
  await t.test("throws an error when JWT_SECRET is not set", async () => {
    await new Promise((resolve) => {
      exec("node src/config/env.js", {
        env: { ...process.env, JWT_SECRET: "" }
      }, (error, stdout, stderr) => {
        assert.ok(error);
        assert.match(stderr, /JWT_SECRET environment variable is required/);
        resolve();
      });
    });
  });
});
