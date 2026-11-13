import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const here = new URL(".", import.meta.url);
const webManifest = JSON.parse(
  readFileSync(new URL("../../../web/package.json", here), "utf8")
);

function parts(version) {
  return version.split(".").map(Number);
}

function isAtLeast(version, [major, minor, patch]) {
  const [a, b, c] = parts(version);
  return a > major || (a === major && (b > minor || (b === minor && c >= patch)));
}

test("the web app pins next outside every critical advisory range", () => {
  const version = webManifest.dependencies.next;

  assert.match(version, /^\d+\.\d+\.\d+$/);
  // GHSA-p293-qw3h-jr36 and GHSA-2xp9-vwfh-vxw4 affect >=16.0.0 <16.3.3.
  assert.equal(isAtLeast(version, [16, 3, 3]), true);
  // GHSA-vcvr-r3jv-pc5j affects >=16.2.0 <16.3.6.
  assert.equal(isAtLeast(version, [16, 3, 6]), true);
});
