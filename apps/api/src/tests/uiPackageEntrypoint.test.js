import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const pkgRoot = `${root}packages/ui/`;

function manifest() {
  return JSON.parse(readFileSync(`${pkgRoot}package.json`, "utf8"));
}

test("ui package points consumers at emitted JavaScript", () => {
  const pkg = manifest();

  assert.equal(pkg.name, "@freelanceflow/ui");
  assert.equal(pkg.type, "module");
  assert.equal(pkg.main, "dist/index.js");
  assert.equal(pkg.types, "src/index.ts");
  assert.equal(pkg.exports["."].default, "./dist/index.js");
  assert.equal(pkg.exports["."].types, "./src/index.ts");
});

test("ui package ships the emitted entrypoint and components", () => {
  const pkg = manifest();

  for (const relative of [pkg.main, pkg.types, "dist/Button.js", "dist/Card.js"]) {
    assert.ok(existsSync(`${pkgRoot}${relative}`), `${relative} must exist`);
  }
});

test("emitted entrypoint re-exports both components", () => {
  const source = readFileSync(`${pkgRoot}dist/index.js`, "utf8");

  assert.match(source, /Button\.js/);
  assert.match(source, /Card\.js/);
});
