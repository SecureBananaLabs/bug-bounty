/**
 * @file sanitizeSvg.test.js
 * Unit tests for sanitizeSvgContent utility.
 */

import assert from 'assert';
import { sanitizeSvgContent } from '../utils/sanitizeSvg.js';

function runTests() {
  console.log('Running sanitizeSvg unit tests...');

  // Test 1: Empty and null inputs
  {
    assert.strictEqual(sanitizeSvgContent(''), '');
    assert.strictEqual(sanitizeSvgContent(null), '');
    assert.strictEqual(sanitizeSvgContent(undefined), '');
    console.log('✔ Test 1 passed: Empty and null input handling');
  }

  // Test 2: Stripping <script> tags and embedded executable code
  {
    const input = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/><script>alert("XSS")</script></svg>';
    const output = sanitizeSvgContent(input);

    assert.ok(!output.includes('<script'));
    assert.ok(!output.includes('alert'));
    assert.ok(output.includes('<circle'));
    console.log('✔ Test 2 passed: <script> tags removed completely');
  }

  // Test 3: Stripping inline event handlers (onload, onerror, onclick)
  {
    const input = '<svg onload="alert(1)" onclick="stealCookies()"><rect width="100" height="100" onerror=alert(2) /></svg>';
    const output = sanitizeSvgContent(input);

    assert.ok(!output.includes('onload'));
    assert.ok(!output.includes('onclick'));
    assert.ok(!output.includes('onerror'));
    assert.ok(output.includes('<rect'));
    console.log('✔ Test 3 passed: Inline event handlers stripped');
  }

  // Test 4: Stripping <foreignObject> and nested HTML tags
  {
    const input = '<svg><foreignObject width="100" height="50"><body xmlns="http://www.w3.org/1999/xhtml"><iframe src="http://evil.com"></iframe></body></foreignObject><text>Safe</text></svg>';
    const output = sanitizeSvgContent(input);

    assert.ok(!output.includes('<foreignObject'));
    assert.ok(!output.includes('<iframe'));
    assert.ok(output.includes('<text>Safe</text>'));
    console.log('✔ Test 4 passed: <foreignObject> and iframe elements stripped');
  }

  // Test 5: Stripping javascript: and data: URIs in links
  {
    const input = '<svg><a href="javascript:alert(document.domain)"><text>Click</text></a><image xlink:href="javascript:eval(1)" /></svg>';
    const output = sanitizeSvgContent(input);

    assert.ok(!output.includes('javascript:'));
    assert.ok(!output.includes('alert('));
    assert.ok(output.includes('<text>Click</text>'));
    console.log('✔ Test 5 passed: javascript: URIs sanitized in href and xlink:href');
  }

  // Test 6: Preserves valid, safe SVG tags and attributes
  {
    const safeSvg = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M10 10 H 90 V 90 H 10 Z" fill="red" stroke="black" stroke-width="2"/></svg>';
    const output = sanitizeSvgContent(safeSvg);

    assert.strictEqual(output, safeSvg);
    console.log('✔ Test 6 passed: Valid SVG shapes and styles preserved intact');
  }

  console.log('All sanitizeSvg tests passed successfully!');
}

runTests();
