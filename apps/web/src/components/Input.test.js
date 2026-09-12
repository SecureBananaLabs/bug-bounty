/**
 * @file Input.test.js
 * Unit tests for the Input component using React DOM server static markup rendering.
 */

import assert from 'assert';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Input } from './Input.js';

function runTests() {
  console.log('Running Input component unit tests...');

  // Test 1: Render basic input with placeholder and native props forwarding
  {
    const html = renderToStaticMarkup(
      React.createElement(Input, {
        placeholder: 'Enter your email',
        name: 'email',
        type: 'email',
        required: true,
      })
    );

    assert.ok(html.includes('placeholder="Enter your email"'));
    assert.ok(html.includes('name="email"'));
    assert.ok(html.includes('type="email"'));
    assert.ok(html.includes('required=""') || html.includes('required'));
    console.log('✔ Test 1 passed: Basic input with native props forwarding');
  }

  // Test 2: Render label with linked htmlFor/id
  {
    const html = renderToStaticMarkup(
      React.createElement(Input, {
        label: 'Username',
        id: 'custom_username_id',
      })
    );

    assert.ok(html.includes('<label for="custom_username_id"'));
    assert.ok(html.includes('<span class="label-text">Username</span>'));
    assert.ok(html.includes('id="custom_username_id"'));
    console.log('✔ Test 2 passed: Accessible label with linked ID');
  }

  // Test 3: Render error state with role="alert" and aria-invalid
  {
    const html = renderToStaticMarkup(
      React.createElement(Input, {
        label: 'Password',
        id: 'pwd_input',
        error: 'Password is required',
      })
    );

    assert.ok(html.includes('aria-invalid="true"'));
    assert.ok(html.includes('input-error'));
    assert.ok(html.includes('role="alert"'));
    assert.ok(html.includes('Password is required'));
    console.log('✔ Test 3 passed: Error state rendering with accessibility attributes');
  }

  // Test 4: Render helperText when no error is present
  {
    const html = renderToStaticMarkup(
      React.createElement(Input, {
        label: 'Bio',
        helperText: 'Max 250 characters',
      })
    );

    assert.ok(html.includes('Max 250 characters'));
    assert.ok(html.includes('aria-invalid="false"'));
    console.log('✔ Test 4 passed: Helper text rendering');
  }

  // Test 5: Disabled state prop forwarding
  {
    const html = renderToStaticMarkup(
      React.createElement(Input, {
        disabled: true,
      })
    );

    assert.ok(html.includes('disabled=""') || html.includes('disabled'));
    console.log('✔ Test 5 passed: Disabled state');
  }

  console.log('All Input component tests passed successfully!');
}

runTests();
