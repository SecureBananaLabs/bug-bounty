import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(__dirname, "..");

test("package.json exposes a JavaScript entrypoint", () => {
  const pkg = JSON.parse(
    readFileSync(resolve(pkgDir, "package.json"), "utf-8")
  );
  assert.equal(pkg.main, "dist/index.js", "main should point to dist/index.js");
  assert.equal(pkg.types, "dist/index.d.ts", "types should point to dist/index.d.ts");
  assert.deepEqual(
    pkg.exports,
    {
      ".": {
        types: "./dist/index.d.ts",
        import: "./dist/index.js",
        require: "./dist/index.js",
      },
    },
    "exports should expose types and runtime entrypoints"
  );
});

test("dist/index.js exists and is importable", async () => {
  const distEntry = resolve(pkgDir, "dist", "index.js");
  assert.ok(existsSync(distEntry), "dist/index.js must exist after build");

  const mod = await import(distEntry);
  assert.equal(typeof mod.Button, "function", "Button should be exported");
  assert.equal(typeof mod.Card, "function", "Card should be exported");
});

test("TypeScript declaration files exist", () => {
  assert.ok(
    existsSync(resolve(pkgDir, "dist", "index.d.ts")),
    "dist/index.d.ts must exist"
  );
  assert.ok(
    existsSync(resolve(pkgDir, "dist", "Button.d.ts")),
    "dist/Button.d.ts must exist"
  );
  assert.ok(
    existsSync(resolve(pkgDir, "dist", "Card.d.ts")),
    "dist/Card.d.ts must exist"
  );
});

test("client-supplied main/types are ignored in favor of dist", () => {
  const pkg = JSON.parse(
    readFileSync(resolve(pkgDir, "package.json"), "utf-8")
  );
  // Ensure no one reverts to pointing at src/index.ts
  assert.ok(
    !pkg.main.includes("src/"),
    "main must not point to src/ directory"
  );
  assert.ok(
    !pkg.types.includes("src/"),
    "types must not point to src/ directory"
  );
});
