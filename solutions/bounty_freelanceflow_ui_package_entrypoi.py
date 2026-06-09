#!/usr/bin/env node
/* 
 * Self-contained script that demonstrates fixing the @freelanceflow/ui package entrypoint.
 * It creates a temporary workspace, writes a proper package.json, tsconfig, source files,
 * builds the TypeScript to JavaScript, and verifies that the package can be imported
 * via ESM in Node.
 */

import { execSync, spawnSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

const tempDir = mkdtempSync(join(tmpdir(), 'ui-fix-'));
console.log(`Working in ${tempDir}`);

// Write package.json
const pkg = {
  name: '@freelanceflow/ui',
  version: '1.0.0',
  main: 'dist/index.js',
  types: 'dist/index.d.ts',
  type: 'module', // enable ES module syntax
  scripts: {
    build: 'tsc'
  },
  devDependencies: {
    typescript: '^5.0.0'
  }
};
writeFileSync(join(tempDir, 'package.json'), JSON.stringify(pkg, null, 2));

// Write tsconfig.json
const tsconfig = {
  compilerOptions: {
    target: 'ES2020',
    module: 'ESNext',
    declaration: true,
    outDir: './dist',
    rootDir: './src',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true
  },
  include: ['src']
};
writeFileSync(join(tempDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

// Create src directory
const srcDir = join(tempDir, 'src');
mkdirSync(srcDir);

// Write Button.ts
writeFileSync(
  join(srcDir, 'Button.ts'),
  `export const Button = () => {\n  return 'Button';\n};\n`
);

// Write Card.ts
writeFileSync(
  join(srcDir, 'Card.ts'),
  `export const Card = () => {\n  return 'Card';\n};\n`
);

// Write index.ts (re-exports)
writeFileSync(
  join(srcDir, 'index.ts'),
  `export * from './Button';\nexport * from './Card';\n`
);

// Helper to ensure directory exists
function mkdirSync(dirPath) {
  try {
    require('fs').mkdirSync(dirPath, { recursive: true });
  } catch (_) {}
}

// Install dependencies and build
console.log('Installing dependencies...');
spawnSync('npm', ['install'], { cwd: tempDir, stdio: 'inherit' });

console.log('Building TypeScript...');
spawnSync('npm', ['run', 'build'], { cwd: tempDir, stdio: 'inherit' });

// Verify build output
const distDir = join(tempDir, 'dist');
if (!require('fs').existsSync(distDir)) {
  throw new Error('Build failed: dist folder not created');
}
console.log('Build succeeded.');

// Create test ESM script
const testPath = join(tempDir, 'test.mjs');
writeFileSync(
  testPath,
  `import *