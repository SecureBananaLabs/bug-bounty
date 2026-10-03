import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("env module throws in production when JWT_SECRET is not set", () => {
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", "import \"../config/env.js\""],
    {
      cwd: resolve(__dirname, ".."),
      env: { ...process.env, NODE_ENV: "production", JWT_SECRET: "" },
      encoding: "utf8"
    }
  );
  assert.ok(result.status !== 0, "process should exit with non-zero when JWT_SECRET is absent in production");
  assert.ok(result.stderr.includes("JWT_SECRET"), "error message should mention JWT_SECRET");
});
