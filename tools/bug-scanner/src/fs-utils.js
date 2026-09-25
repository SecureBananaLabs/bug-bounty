import fs from "node:fs";
import path from "node:path";
import { SCAN_EXTENSIONS } from "./constants.js";

export function walkSourceFiles(rootDir, relativeDirs) {
  const files = [];

  for (const relativeDir of relativeDirs) {
    const absoluteDir = path.join(rootDir, relativeDir);
    if (!fs.existsSync(absoluteDir)) {
      continue;
    }
    collectFiles(absoluteDir, files);
  }

  return files.sort();
}

function collectFiles(directory, files) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectFiles(absolutePath, files);
      continue;
    }

    if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(absolutePath);
    }
  }
}

export function readSource(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

export function lineNumberAt(content, index) {
  return content.slice(0, index).split("\n").length;
}
