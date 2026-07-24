import test from 'node:test';
import assert from 'node:assert/strict';
import { createPaymentIntent } from '../services/paymentService.js';

// Mock Stripe module before importing paymentService
// We use a module-level mock via dynamic import interception
// Since the service imports Stripe at the top level, we need to mock before the import
// We'll test validation logic first (which doesn't need Stripe), then integration

test('createPaymentIntent — amount validation', async (t) => {
  await t.test('throws when amount is missing', async () => {
    await assert.rejects(
      () => createPaymentIntent({}),
      { message: 'amount is required' }
    );
  });

  await t.test('throws when amount is null', async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: null }),
      { message: 'amount is required' }
    );
  });

  await t.test('throws when amount is not an integer', async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: 10.5 }),
      { message: 'amount must be a positive integer (smallest currency unit, e.g. cents)' }
    );
  });

  await t.test('throws when amount is zero', async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: 0 }),
      { message: 'amount must be a positive integer (smallest currency unit, e.g. cents)' }
    );
  });

  await t.test('throws when amount is negative', async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: -100 }),
      { message: 'amount must be a positive integer (smallest currency unit, e.g. cents)' }
    );
  });

  await t.test('throws when amount is a string', async () => {
    await assert.rejects(
      () => createPaymentIntent({ amount: '100' }),
      { message: 'amount must be a positive integer (smallest currency unit, e.g. cents)' }
    );
  });
});
