'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const userService = require('../services/userService');
const jobService = require('../services/jobService');
const proposalService = require('../services/proposalService');
const reviewService = require('../services/reviewService');
const messageService = require('../services/messageService');
const notificationService = require('../services/notificationService');

// Regression coverage for #6346: list endpoints must hand callers a shallow
// snapshot of the backing store. In-place array mutations on a response
// (push/pop/splice/truncate) must never reach the module-level array the
// service keeps.
const listFunctions = [
  { name: 'userService.getUsers', list: () => userService.getUsers() },
  { name: 'jobService.getJobs', list: () => jobService.getJobs() },
  { name: 'proposalService.getProposals', list: () => proposalService.getProposals() },
  { name: 'reviewService.getReviews', list: () => reviewService.getReviews() },
  { name: 'messageService.getMessages', list: () => messageService.getMessages() },
  { name: 'notificationService.getNotifications', list: () => notificationService.getNotifications() },
];

for (const { name, list } of listFunctions) {
  test(`${name} returns a snapshot that cannot corrupt the backing store`, () => {
    const baseline = list();
    const expectedLength = baseline.length;
    const expectedIds = baseline.map((record) => record.id);

    // Every in-place array mutation a hostile in-process caller could make.
    const snapshot = list();
    snapshot.push({ id: '__sentinel__' });
    snapshot.unshift({ id: '__sentinel__' });
    snapshot.pop();
    snapshot.shift();
    snapshot.splice(0, snapshot.length, { id: '__sentinel__' });
    snapshot.length = 0;

    const after = list();
    assert.equal(
      after.length,
      expectedLength,
      `${name}: backing store length changed after mutating a list response`
    );
    assert.deepEqual(
      after.map((record) => record.id),
      expectedIds,
      `${name}: backing store contents changed after mutating a list response`
    );
  });

  test(`${name} preserves response shape and record objects (shallow copy)`, () => {
    const first = list();
    const second = list();

    assert.ok(Array.isArray(first), `${name}: response must be an array`);
    assert.notEqual(first, second, `${name}: must not hand out the backing array`);
    assert.equal(second.length, first.length, `${name}: snapshot length mismatch`);

    if (first.length > 0) {
      assert.equal(
        second[0],
        first[0],
        `${name}: record objects must be preserved by the shallow copy`
      );
    }
  });
}
