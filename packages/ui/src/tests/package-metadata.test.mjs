import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(testDir, "..", "..");
const packageJson = JSON.parse(
  await readFile(path.join(packageRoot, "package.json"), "utf8")
);

test("@freelanceflow/ui declares React as a peer dependency", () => {
  assert.match(
    packageJson.peerDependencies?.react ?? "",
    /\S/,
    "React should be declared as a peer dependency of the UI package"
  );
  assert.equal(
    packageJson.dependencies?.react,
    undefined,
    "React should not be bundled as a direct UI package dependency"
  );
});

test("@freelanceflow/ui has local React development metadata", () => {
  assert.match(
    packageJson.devDependencies?.react ?? "",
    /\S/,
    "React should be available for local UI package development checks"
  );
  assert.match(
    packageJson.devDependencies?.["@types/react"] ?? "",
    /\S/,
    "React types should be available for local UI package development checks"
  );
});
