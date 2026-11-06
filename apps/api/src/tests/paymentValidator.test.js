/**
 * @file paymentValidator.test.js
 * Unit tests for payment creation validator and transactionId bounds checking.
 */

import assert from 'assert';
import {
  isValidTransactionId,
  validateCreatePayment,
} from '../validators/payment.js';

function runTests() {
  console.log('Running payment validator unit tests...');

  // Test 1: Valid transactionId lengths (8-64 characters)
  {
    const validIds = [
      'tx_12345',                     // 8 chars
      'tx_9876543210_abcdef',         // 21 chars
      '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', // 42 chars EVM address
      'a'.repeat(64),                 // 64 chars
    ];

    for (const txId of validIds) {
      assert.strictEqual(isValidTransactionId(txId), true, `Failed on valid txId: ${txId}`);
      const res = validateCreatePayment({ transactionId: txId, amount: 100 });
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.data.transactionId, txId);
      assert.strictEqual(res.data.amount, 100);
      assert.strictEqual(res.data.currency, 'USD');
    }
    console.log('✔ Test 1 passed: Valid transactionId lengths accepted');
  }

  // Test 2: Invalid transactionId lengths (< 8 or > 64 chars) and malformed inputs
  {
    const invalidIds = [
      'tx_123',                       // 6 chars (too short)
      '1234567',                      // 7 chars (too short)
      'a'.repeat(65),                 // 65 chars (too long)
      '',
      '   ',
      null,
      undefined,
      12345678,
    ];

    for (const txId of invalidIds) {
      assert.strictEqual(isValidTransactionId(txId), false, `Should reject invalid txId: ${txId}`);
      const res = validateCreatePayment({ transactionId: txId, amount: 50 });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'transactionId must be between 8 and 64 characters');
    }
    console.log('✔ Test 2 passed: Invalid transactionId lengths rejected with strict error message');
  }

  // Test 3: Invalid amounts (zero, negative, NaN, string)
  {
    const invalidAmounts = [0, -10, NaN, Infinity, -Infinity, 'invalid_number', null, undefined];

    for (const amt of invalidAmounts) {
      const res = validateCreatePayment({ transactionId: 'tx_valid_12345', amount: amt });
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.error, 'Valid positive amount is required');
    }
    console.log('✔ Test 3 passed: Invalid amounts rejected safely');
  }

  // Test 4: Custom currency and optional IDs
  {
    const res = validateCreatePayment({
      transactionId: 'tx_stripe_charge_998877',
      amount: '250.50',
      currency: 'eur',
      contractId: 'ctr_123',
      milestoneId: 'ms_456',
    });

    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.data.amount, 250.5);
    assert.strictEqual(res.data.currency, 'EUR');
    assert.strictEqual(res.data.contractId, 'ctr_123');
    assert.strictEqual(res.data.milestoneId, 'ms_456');
    console.log('✔ Test 4 passed: Currency normalization and optional fields handling');
  }

  console.log('All payment validator tests passed successfully!');
}

runTests();
