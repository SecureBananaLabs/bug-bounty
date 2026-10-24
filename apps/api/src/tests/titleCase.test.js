import test from 'node:test';
import assert from 'node:assert/strict';
import { toTitleCase } from '../utils/titleCase.js';

test('toTitleCase converts basic sentences to title case', () => {
  assert.equal(toTitleCase('senior backend developer and architect'), 'Senior Backend Developer and Architect');
  assert.equal(toTitleCase('the quick brown fox jumps over a lazy dog'), 'The Quick Brown Fox Jumps Over a Lazy Dog');
});

test('toTitleCase capitalizes minor words when at the start or end', () => {
  assert.equal(toTitleCase('a tale of two cities'), 'A Tale of Two Cities');
  assert.equal(toTitleCase('what are you looking for'), 'What Are You Looking For');
});

test('toTitleCase handles hyphenated words', () => {
  assert.equal(toTitleCase('full-stack software engineer'), 'Full-Stack Software Engineer');
  assert.equal(toTitleCase('state-of-the-art machine learning'), 'State-of-the-Art Machine Learning');
});

test('toTitleCase normalizes multiple whitespace', () => {
  assert.equal(toTitleCase('   multiple    spaces    between    words   '), 'Multiple Spaces Between Words');
});

test('toTitleCase defensively handles non-string and empty inputs', () => {
  assert.equal(toTitleCase(null), '');
  assert.equal(toTitleCase(undefined), '');
  assert.equal(toTitleCase(12345), '');
  assert.equal(toTitleCase({}), '');
  assert.equal(toTitleCase(''), '');
});
