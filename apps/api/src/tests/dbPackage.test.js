import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { join } from "path";

const repoRoot = "/root/money-maker/SecureBananaLabs-bug-bounty";
const pkgPath = join(repoRoot, "packages", "db", "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

test("@freelanceflow/db package.json has main field", () => {
  assert.ok(pkg.main, "package.json should have a main field");
  assert.equal(pkg.main, "src/index.ts");
});

test("@freelanceflow/db package.json has types field", () => {
  assert.ok(pkg.types, "package.json should have a types field");
  assert.equal(pkg.types, "src/index.ts");
});

test("@freelanceflow/db package.json has exports field", () => {
  assert.ok(pkg.exports, "package.json should have an exports field");
  assert.ok(pkg.exports["."], "exports should have a root entry");
});

test("@freelanceflow/db source entrypoint exists", () => {
  const srcPath = join(repoRoot, "packages", "db", "src", "index.ts");
  const content = readFileSync(srcPath, "utf-8");
  assert.ok(content.length > 0, "src/index.ts should not be empty");
});
