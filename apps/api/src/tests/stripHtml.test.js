import test from 'node:test';
import assert from 'node:assert/strict';
import { stripHtml } from '../utils/stripHtml.js';

test('stripHtml strips basic HTML tags from string', () => {
  assert.equal(stripHtml('<p>Hello <b>World</b>!</p>'), 'Hello World!');
});

test('stripHtml removes script tags and dangerous script content', () => {
  assert.equal(stripHtml('Before <script>alert("xss")</script> After'), 'Before  After');
});

test('stripHtml removes style tags and css blocks', () => {
  assert.equal(stripHtml('<style>body { color: red; }</style>Content'), 'Content');
});

test('stripHtml decodes standard HTML entities', () => {
  assert.equal(stripHtml('Tom &amp; Jerry &lt;3 Cheese &quot;Delicious&quot;'), 'Tom & Jerry <3 Cheese "Delicious"');
});

test('stripHtml handles unclosed or malformed tags gracefully', () => {
  assert.equal(stripHtml('Text <tag with unclosed attribute> End'), 'Text  End');
});

test('stripHtml defensively handles non-string and empty inputs', () => {
  assert.equal(stripHtml(null), '');
  assert.equal(stripHtml(undefined), '');
  assert.equal(stripHtml(12345), '');
  assert.equal(stripHtml({}), '');
  assert.equal(stripHtml('   '), '');
});
