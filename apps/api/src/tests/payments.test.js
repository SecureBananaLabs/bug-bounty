/**
 * @file payments.test.js
 * Unit and integration tests for payment creation validation and paymentController handling.
 */

import assert from 'assert';
import {
  createPaymentSchema,
  validateCreatePayment,
  SUPPORTED_CURRENCIES,
} from '../validators/payment.js';
import { createPayment } from '../controllers/paymentController.js';

async function runTests() {
  console.log('Running payment validation unit tests...');

  // Test 1: Valid payment creation (201 Created)
  {
    const validPayloads = [
      { transactionId: 'tx_12345678', amount: 100, currency: 'usd' },
      { transactionId: 'tx_abcdefgh', amount: 50.5, currency: 'EUR' },
      { transactionId: 'tx_99887766', amount: 2500, currency: 'gbp' },
    ];

    for (const payload of validPayloads) {
      const validation = validateCreatePayment(payload);
      assert.strictEqual(validation.valid, true, `Failed on valid payload: ${JSON.stringify(payload)}`);
      assert.strictEqual(validation.data.amount, payload.amount);
      assert.ok(SUPPORTED_CURRENCIES.includes(validation.data.currency));

      let statusCalled = 0;
      let jsonResult = null;
      const mockRes = {
        status: (code) => {
          statusCalled = code;
          return {
            json: (data) => {
              jsonResult = data;
              return data;
            },
          };
        },
      };

      await createPayment({ body: payload }, mockRes);
      assert.strictEqual(statusCalled, 201);
      assert.strictEqual(jsonResult.success, true);
    }
    console.log('✔ Test 1 passed: Valid payment payloads accepted with HTTP 201');
  }

  // Test 2: Non-positive amounts rejected (400 Bad Request)
  {
    const invalidAmounts = [0, -10, -0.01, NaN, 'one hundred'];

    for (const amt of invalidAmounts) {
      const payload = { transactionId: 'tx_12345678', amount: amt, currency: 'usd' };
      const validation = validateCreatePayment(payload);
      assert.strictEqual(validation.valid, false);

      let statusCalled = 0;
      const mockRes = {
        status: (code) => {
          statusCalled = code;
          return {
            json: (data) => data,
          };
        },
      };

      await createPayment({ body: payload }, mockRes);
      assert.strictEqual(statusCalled, 400);
    }
    console.log('✔ Test 2 passed: Non-positive amounts rejected with HTTP 400');
  }

  // Test 3: Unsupported currency rejected
  {
    const invalidCurrencies = ['jpy', 'cad', 'btc', 123];

    for (const cur of invalidCurrencies) {
      const payload = { transactionId: 'tx_12345678', amount: 100, currency: cur };
      const validation = validateCreatePayment(payload);
      assert.strictEqual(validation.valid, false);
    }
    console.log('✔ Test 3 passed: Unsupported currencies rejected');
  }

  // Test 4: Missing payload or empty object
  {
    assert.strictEqual(validateCreatePayment(null).valid, false);
    assert.strictEqual(validateCreatePayment({}).valid, false);
    console.log('✔ Test 4 passed: Empty/null payloads rejected');
  }

  console.log('All payment tests passed successfully!');
}

runTests();
