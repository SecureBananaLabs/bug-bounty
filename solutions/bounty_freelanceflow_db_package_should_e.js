const fs = require('fs');
const path = require('path');

function main() {
  const pkgPath = path.resolve(__dirname, 'packages', 'db', 'package.json');
  let pkg;
  try {
    const raw = fs.readFileSync(pkgPath, 'utf8');
    pkg = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read or parse ${pkgPath}:`, err);
    process.exit(1);
  }

  // Ensure main, types, and exports are set for a reliable entrypoint.
  // Adjust paths if your build output differs.
  pkg.main = './dist/index.js';
  pkg.types = './dist/index.d.ts';
  pkg.exports = {
    '.': {
      import: './dist/index.esm.js',
      require: './dist/index.cjs.js',
    },
  };

  try {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log(`Updated ${pkgPath}`);
  } catch (err) {
    console.error(`Failed to write ${pkgPath}:`, err);
    process.exit(1);
  }

  // Create a simple import test to verify the package can be consumed via workspace name.
  const testDir = path.resolve(__dirname, 'packages', 'db', 'test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  const testPath = path.resolve(testDir, 'db-import.test.ts');
  const testContent = `
// Simple test to verify @freelanceflow/db can be imported from the workspace.
import * as db from '@freelanceflow/db';

// The actual shape of the export depends on your library; this test only ensures
// the import succeeds and the module is not undefined.
if (typeof db === 'undefined') {
  throw new Error('Failed to import @freelanceflow/db');
}
console.log('✅ @freelanceflow/db imported successfully');
`;
  try {
    fs.writeFileSync(testPath, testContent.trim() + '\n', 'utf8');
    console.log(`Created test file at ${testPath}`);
  } catch (err) {
    console.error(`Failed to write test file ${testPath}:`, err);
    process.exit(1);
  }
}

main();