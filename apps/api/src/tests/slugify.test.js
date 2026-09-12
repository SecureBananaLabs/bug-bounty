/**
 * @file slugify.test.js
 * Unit tests for slugify utility.
 */

import assert from 'assert';
import { slugify } from '../utils/slugify.js';

function runTests() {
  console.log('Running slugify unit tests...');

  // Test 1: Basic text slugification with lowercase and hyphens
  {
    assert.strictEqual(slugify('Hello World'), 'hello-world');
    assert.strictEqual(slugify('Senior Fullstack Developer (Node.js & React)'), 'senior-fullstack-developer-node-js-react');
    console.log('✔ Test 1 passed: Basic English strings');
  }

  // Test 2: Multilingual unicode accents and diacritics normalization
  {
    assert.strictEqual(slugify('Desarrollador Web en España y Latinoamérica'), 'desarrollador-web-en-espana-y-latinoamerica');
    assert.strictEqual(slugify('Café & Crème Brûlée Délicieuse'), 'cafe-creme-brulee-delicieuse');
    console.log('✔ Test 2 passed: Diacritics and accents normalization');
  }

  // Test 3: Special characters, symbols, and consecutive spaces/dashes
  {
    assert.strictEqual(slugify('---Special $#@ Symbols & Whitespace   ---'), 'special-symbols-whitespace');
    assert.strictEqual(slugify('Crypto / Web3 / Escrow ::: 100% Guaranteed'), 'crypto-web3-escrow-100-guaranteed');
    console.log('✔ Test 3 passed: Special characters collapsing and trimming');
  }

  // Test 4: Custom options (separator and uppercase retention)
  {
    assert.strictEqual(slugify('Hello World', { separator: '_' }), 'hello_world');
    assert.strictEqual(slugify('Invoice 2026 Q3', { lower: false, separator: '.' }), 'Invoice.2026.Q3');
    assert.strictEqual(slugify('  trim test  ', { trim: false }), '-trim-test-');
    console.log('✔ Test 4 passed: Custom options (separator, case, trim)');
  }

  // Test 5: Empty, null, and edge case inputs
  {
    assert.strictEqual(slugify(''), '');
    assert.strictEqual(slugify(null), '');
    assert.strictEqual(slugify(undefined), '');
    assert.strictEqual(slugify(123456), '123456');
    console.log('✔ Test 5 passed: Null, undefined, and non-string inputs');
  }

  console.log('All slugify tests passed successfully!');
}

runTests();
