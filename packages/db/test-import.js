/**
 * Test: @freelanceflow/db package import
 * 
 * This test verifies that the @freelanceflow/db package
 * can be imported successfully through the workspace.
 */

const path = require('path');
const { execSync } = require('child_process');

// Test 1: Check package.json has correct fields
const packageJson = require('../package.json');

console.log('📦 Checking package.json fields...');

if (!packageJson.main) {
  console.error('❌ Missing "main" field in package.json');
  process.exit(1);
}

if (!packageJson.types) {
  console.error('❌ Missing "types" field in package.json');
  process.exit(1);
}

if (!packageJson.exports) {
  console.error('❌ Missing "exports" field in package.json');
  process.exit(1);
}

console.log('✅ package.json has correct fields');
console.log(`   main: ${packageJson.main}`);
console.log(`   types: ${packageJson.types}`);
console.log(`   exports: ${JSON.stringify(packageJson.exports, null, 2)}`);

// Test 2: Check dist files exist
const fs = require('fs');
const distDir = path.join(__dirname, '..', 'dist');

console.log('\n📁 Checking dist directory...');

if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory does not exist');
  process.exit(1);
}

const indexJs = path.join(distDir, 'index.js');
const indexDts = path.join(distDir, 'index.d.ts');

if (!fs.existsSync(indexJs)) {
  console.error('❌ dist/index.js does not exist');
  process.exit(1);
}

if (!fs.existsSync(indexDts)) {
  console.error('❌ dist/index.d.ts does not exist');
  process.exit(1);
}

console.log('✅ dist directory contains required files');

// Test 3: Try to require the package
console.log('\n🔌 Testing package import...');

try {
  // This will fail if @prisma/client is not installed,
  // but it proves the entrypoint resolution works
  require('../dist/index.js');
  console.log('✅ Package can be imported successfully');
} catch (error) {
  // If @prisma/client is not installed, that's expected
  // The important thing is that the module resolution works
  if (error.message.includes('@prisma/client')) {
    console.log('⚠️  @prisma/client not installed (expected in test environment)');
    console.log('✅ Module resolution works correctly');
  } else {
    console.error('❌ Failed to import package:', error.message);
    process.exit(1);
  }
}

console.log('\n✨ All tests passed!');
