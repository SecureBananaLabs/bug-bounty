import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packagePath = path.join(scriptDir, "..", "package.json");
const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
const startScript = packageJson.scripts?.start ?? "";

assert.match(startScript, /\$\{PORT:-3000\}/, "start script must use the platform PORT with a local 3000 fallback");
assert.doesNotMatch(startScript, /next start -p 3000$/, "start script must not hardcode only port 3000");
