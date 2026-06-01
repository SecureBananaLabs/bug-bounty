/**
 * Simple test: @freelanceflow/db package import
 */

const fs = require('fs');
const path = require('path');

console.log('📦 Checking package.json fields...');

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

if (!packageJson.main) {
  console.error('❌ Missing "main" field');
  process.exit(1);
}

if (!packageJson.types) {
  console.error('❌ Missing "types" field');
  process.exit(1);
}

if (!packageJson.exports) {
  console.error('❌ Missing "exports" field');
  process.exit(1);
}

console.log('✅ package.json has correct fields');

console.log('\n📁 Checking dist files...');

if (!fs.existsSync(path.join(__dirname, 'dist', 'index.js'))) {
  console.error('❌ dist/index.js missing');
  process.exit(1);
}

if (!fs.existsSync(path.join(__dirname, 'dist', 'index.d.ts'))) {
  console.error('❌ dist/index.d.ts missing');
  process.exit(1);
}

console.log('✅ dist files exist');

console.log('\n✨ All checks passed!');
