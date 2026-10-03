import fs from "node:fs";
import path from "node:path";
import { DEFAULT_SCAN_DIRS } from "./constants.js";
import { detectors } from "./detectors/index.js";
import { walkSourceFiles, readSource } from "./fs-utils.js";
import { dedupeFindings, relatedDirectoriesForFindings, sortFindings } from "./issue-formatter.js";

function collectFilesForPass(rootDir, scanDirs) {
  return walkSourceFiles(rootDir, scanDirs);
}

function runDetectors(rootDir, files) {
  const context = {
    rootDir,
    files,
    readFile: readSource
  };

  return detectors.flatMap((detector) => detector(context));
}

function directoriesToScanDirs(rootDir, directories) {
  return [...new Set(directories.map((directory) => path.relative(rootDir, directory)))].filter(
    Boolean
  );
}

export function scanRepository({
  rootDir = process.cwd(),
  scanDirs = DEFAULT_SCAN_DIRS,
  recursive = true,
  maxDepth = 2
}) {
  const allFindings = [];
  let currentDirs = [...scanDirs];
  let depth = 0;

  while (currentDirs.length > 0 && depth <= maxDepth) {
    const files = collectFilesForPass(rootDir, currentDirs);
    const findings = runDetectors(rootDir, files);
    allFindings.push(...findings);

    if (!recursive || depth === maxDepth) {
      break;
    }

    const nextDirectories = relatedDirectoriesForFindings(findings, rootDir);
    currentDirs = directoriesToScanDirs(
      rootDir,
      nextDirectories.filter((directory) => fs.existsSync(directory))
    );
    depth += 1;
  }

  return sortFindings(dedupeFindings(allFindings));
}
