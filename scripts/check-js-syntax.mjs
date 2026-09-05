import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const EXCLUDED_DIRS = new Set([
  ".git",
  ".next",
  "coverage",
  "dist",
  "node_modules"
]);

const JS_EXTENSIONS = new Set([".cjs", ".js", ".mjs"]);

function hasJavaScriptExtension(filePath) {
  return [...JS_EXTENSIONS].some((extension) => filePath.endsWith(extension));
}

function collectJavaScriptFiles(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    if (EXCLUDED_DIRS.has(entry)) {
      continue;
    }

    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      collectJavaScriptFiles(fullPath, files);
    } else if (stats.isFile() && hasJavaScriptExtension(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = collectJavaScriptFiles(process.cwd());
let failed = false;

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8"
  });

  if (result.status !== 0) {
    failed = true;
    process.stderr.write(result.stderr || result.stdout);
  }
}

if (failed) {
  process.exit(1);
}

console.log(`Checked JavaScript syntax in ${files.length} files.`);
