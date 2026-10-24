import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const manifestPath = `${root}packages/db/package.json`;

function manifest() {
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

test("db package declares an importable entrypoint", () => {
  const pkg = manifest();

  assert.equal(pkg.name, "@freelanceflow/db");
  assert.equal(pkg.main, "dist/index.js");
  assert.equal(pkg.types, "src/index.ts");
  assert.equal(pkg.exports["."].default, "./dist/index.js");
  assert.equal(pkg.exports["."].types, "./src/index.ts");
});

test("db package ships the JavaScript entrypoint it points at", () => {
  const pkg = manifest();
  const pkgRoot = `${root}packages/db/`;

  assert.ok(existsSync(`${pkgRoot}${pkg.main}`));
  assert.ok(existsSync(`${pkgRoot}${pkg.types}`));
});
