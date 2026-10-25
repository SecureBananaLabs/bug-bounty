#!/usr/bin/env node
/**
 * Lint script: validates syntax of all JS files under apps/api/src/
 * Uses Node.js --check flag to detect syntax errors without executing.
 * No new dependencies required.
 */
const { execSync } = require('child_process');
const { readdirSync, statSync, readFileSync } = require('fs');
const { join } = require('path');

function findJsFiles(dir) {
  let results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results = results.concat(findJsFiles(full));
    } else if (entry.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

const files = findJsFiles(join(__dirname, '..', 'apps', 'api', 'src'));
let failed = false;

for (const file of files) {
  try {
    // Use node --check to validate syntax without executing
    execSync(`node --check "${file}"`, { stdio: ['pipe', 'pipe', 'pipe'], timeout: 5000 });
    console.log(`OK  ${file}`);
  } catch (e) {
    console.error(`FAIL ${file}`);
    console.error(`  ${e.stderr?.toString().trim() || e.message}`);
    failed = true;
  }
}

if (failed) {
  console.error('\nSome files failed syntax check.');
  process.exit(1);
} else {
  console.log(`\nAll ${files.length} files passed syntax check.`);
}
