'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const reviewService = require('../services/reviewService');

function withFrozenTime(fn) {
  const realNow = Date.now;
  const frozen = realNow();
  Date.now = () => frozen;
  try {
    return fn();
  } finally {
    Date.now = realNow;
  }
}

test('two same-millisecond creates receive distinct rev_ ids', () => {
  withFrozenTime(() => {
    const first = reviewService.createReview({ rating: 5, comment: 'great' });
    const second = reviewService.createReview({ rating: 4, comment: 'good' });

    assert.ok(first.id.startsWith('rev_'), `missing rev_ prefix: ${first.id}`);
    assert.ok(second.id.startsWith('rev_'), `missing rev_ prefix: ${second.id}`);
    assert.notStrictEqual(first.id, second.id);
  });
});

test('same-millisecond creates stay unique at volume and retrievable by id', () => {
  withFrozenTime(() => {
    const ids = new Set();
    for (let i = 0; i < 500; i += 1) {
      const review = reviewService.createReview({ rating: 3, jobId: `job_${i}` });
      assert.ok(review.id.startsWith('rev_'), `missing rev_ prefix: ${review.id}`);
      ids.add(review.id);
    }
    assert.strictEqual(ids.size, 500, 'expected 500 unique ids');

    for (const id of ids) {
      const found = reviewService.getReviewById(id);
      assert.ok(found, `review ${id} should be retrievable`);
      assert.strictEqual(found.id, id);
    }
  });
});

test('generateReviewId keeps the rev_ prefix under a stalled clock', () => {
  const realNow = Date.now;
  Date.now = () => 1_700_000_000_000;
  try {
    const seen = new Set();
    for (let i = 0; i < 100; i += 1) {
      const id = reviewService.generateReviewId();
      assert.ok(id.startsWith('rev_'), `missing rev_ prefix: ${id}`);
      assert.ok(!seen.has(id), `duplicate id generated: ${id}`);
      seen.add(id);
    }
  } finally {
    Date.now = realNow;
  }
});
