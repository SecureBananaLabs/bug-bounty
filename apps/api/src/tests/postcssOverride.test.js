import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readJson(relativePath) {
  const fileUrl = new URL(relativePath, import.meta.url);

  return JSON.parse(readFileSync(fileUrl, "utf8"));
}

test("root package.json overrides postcss to a patched release", () => {
  const manifest = readJson("../../../../package.json");

  assert.equal(manifest.overrides.postcss, "8.5.10");
});

test("lockfile resolves postcss to the overridden version", () => {
  const lock = readJson("../../../../package-lock.json");

  assert.equal(lock.packages["node_modules/postcss"].version, "8.5.10");
});
