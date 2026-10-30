import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function readJson(relative) {
  return JSON.parse(
    readFileSync(new URL(relative, import.meta.url), "utf8"),
  );
}

function majorMinor(patch) {
  const [major, minor] = patch.split(".").map(Number);
  return [major, minor];
}

test("the api workspace requires multer 2.3.0 or newer", () => {
  const manifest = readJson("../../../../apps/api/package.json");
  const range = manifest.dependencies.multer;

  assert.equal(range.startsWith("^"), true);

  const [major, minor] = majorMinor(range.slice(1));
  assert.ok(major > 2 || (major === 2 && minor >= 3), `got ${range}`);
});

test("the lockfile resolves multer to a patched release", () => {
  const lock = readJson("../../../../package-lock.json");
  const entry = lock.packages["node_modules/multer"];

  assert.ok(entry, "multer is missing from the lockfile");

  const [major, minor] = majorMinor(entry.version);
  assert.ok(
    major > 2 || (major === 2 && minor >= 3),
    `multer ${entry.version} is still inside the advisory range`,
  );
});
