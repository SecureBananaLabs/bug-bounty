// Focused service coverage for #6334: user records must never store or
// return submitted password material.
//
// Uses the Node.js built-in test runner (no new dependencies):
//   node --test apps/api/src/tests/userService.test.js

const { test } = require('node:test');
const assert = require('node:assert/strict');

const userService = require('../services/userService');

test('createUser does not store a submitted password', () => {
  const user = userService.createUser({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'super-secret-123',
  });

  assert.ok(!('password' in user), 'password must not be stored');
  assert.equal(user.name, 'Ada Lovelace');
  assert.equal(user.email, 'ada@example.com');
});

test('createUser drops all password-material variants', () => {
  const user = userService.createUser({
    email: 'variants@example.com',
    password: 'p',
    passwordHash: '$2b$fake-hash',
    passwordConfirmation: 'p',
    confirmPassword: 'p',
  });

  assert.ok(!('password' in user));
  assert.ok(!('passwordHash' in user));
  assert.ok(!('passwordConfirmation' in user));
  assert.ok(!('confirmPassword' in user));
});

test('getUserById never exposes password material', () => {
  const created = userService.createUser({
    name: 'Grace Hopper',
    email: 'grace@example.com',
    password: 'secret',
  });

  const found = userService.getUserById(created.id);
  assert.ok(found);
  assert.ok(!('password' in found));
  assert.equal(found.email, 'grace@example.com');
});

test('getAllUsers returns no password fields on any record', () => {
  userService.createUser({ email: 'listed@example.com', password: 'nope' });

  const all = userService.getAllUsers();
  assert.ok(all.length > 0);
  for (const record of all) {
    assert.ok(!('password' in record));
    assert.ok(!('passwordHash' in record));
  }
});

test('updateUser refuses to add password material later', () => {
  const user = userService.createUser({ email: 'updatable@example.com', name: 'Before' });

  const updated = userService.updateUser(user.id, {
    name: 'After',
    password: 'injected-late',
  });

  assert.equal(updated.name, 'After');
  assert.ok(!('password' in updated));
});

test('non-secret profile fields are preserved', () => {
  const user = userService.createUser({
    name: 'Linus',
    email: 'linus@example.com',
    role: 'developer',
    bio: 'Likes kernels',
  });

  assert.equal(user.name, 'Linus');
  assert.equal(user.email, 'linus@example.com');
  assert.equal(user.role, 'developer');
  assert.equal(user.bio, 'Likes kernels');
  assert.ok(user.id);
  assert.ok(user.createdAt);
});
