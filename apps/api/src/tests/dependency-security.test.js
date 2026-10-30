import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../");
const lock = JSON.parse(fs.readFileSync(path.join(repoRoot, "package-lock.json"), "utf8"));

function version(name) {
  return lock.packages?.[`node_modules/${name}`]?.version ?? "";
}

function tuple(value) {
  const match = String(value).match(/^(\d+)\.(\d+)\.(\d+)/);
  assert.ok(match, `invalid semver for ${value}`);
  return match.slice(1).map(Number);
}

function atLeast(actual, minimum) {
  const a = tuple(actual);
  const b = tuple(minimum);
  for (let i = 0; i < 3; i += 1) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return true;
}

test("API dependency graph stays beyond patched security boundaries", () => {
  const floors = {
    express: "4.22.3",
    "body-parser": "1.20.8",
    "proxy-addr": "2.0.8",
    qs: "6.16.0",
  };

  for (const [name, minimum] of Object.entries(floors)) {
    const actual = version(name);
    assert.ok(actual, `${name} must be present in package-lock.json`);
    assert.equal(
      atLeast(actual, minimum),
      true,
      `${name}@${actual} must remain >= ${minimum}`,
    );
  }
});
