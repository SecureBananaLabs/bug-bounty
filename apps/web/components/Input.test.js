import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Input } from './Input.tsx';

describe('Input Component Interface', () => {
  it('exports Input component as forwardRef function with displayName', () => {
    assert.equal(typeof Input, 'object'); // forwardRef returns an object in React
    assert.equal(Input.displayName, 'Input');
  });
});
