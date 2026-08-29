/**
 * @file Button.test.js
 * Unit tests for Button component prop forwarding and style merging.
 */

import assert from 'assert';
import React from 'react';
import { Button } from './Button.js';

async function runTests() {
  console.log('Running Button component unit tests...');

  // Test 1: Render default button with children
  {
    const element = Button({ children: 'Click Me' });
    assert.strictEqual(element.type, 'button');
    assert.strictEqual(element.props.children, 'Click Me');
    assert.strictEqual(element.props.style.background, '#5468ff');
    assert.strictEqual(element.props.style.color, 'white');
    assert.strictEqual(element.props.style.borderRadius, 8);
    console.log('✔ Test 1 passed: Default Button renders with correct default styling and children');
  }

  // Test 2: Native HTML props forwarding (disabled, type, id, aria-label, onClick)
  {
    let clicked = false;
    const onClick = () => { clicked = true; };
    const element = Button({
      children: 'Submit Form',
      type: 'submit',
      disabled: true,
      id: 'submit-btn',
      'aria-label': 'Submit proposal form',
      onClick,
    });

    assert.strictEqual(element.props.type, 'submit');
    assert.strictEqual(element.props.disabled, true);
    assert.strictEqual(element.props.id, 'submit-btn');
    assert.strictEqual(element.props['aria-label'], 'Submit proposal form');
    assert.strictEqual(element.props.onClick, onClick);
    console.log('✔ Test 2 passed: Native HTML props forwarded properly');
  }

  // Test 3: Custom style merging
  {
    const customStyle = { background: 'red', marginTop: 10 };
    const element = Button({ children: 'Danger Action', style: customStyle });

    assert.strictEqual(element.props.style.background, 'red'); // overridden
    assert.strictEqual(element.props.style.color, 'white');    // preserved
    assert.strictEqual(element.props.style.marginTop, 10);     // merged
    console.log('✔ Test 3 passed: Custom styles correctly merge and override defaults');
  }

  console.log('All Button component tests passed successfully!');
}

runTests();
