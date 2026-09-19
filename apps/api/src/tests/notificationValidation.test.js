/**
 * @file notificationValidation.test.js
 * Unit tests for notification creation schema and validation logic.
 */

import assert from 'assert';
import {
  createNotificationSchema,
  validateCreateNotification,
} from '../validators/notification.js';

function runTests() {
  console.log('Running notification validation unit tests...');

  // Test 1: Valid notification creation payload
  {
    const validPayload = {
      userId: 'usr_abc123',
      title: 'Payment Received',
      body: 'You received 500 USDC for completing Milestone 1.',
      type: 'payment',
    };

    const res = validateCreateNotification(validPayload);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.data.userId, 'usr_abc123');
    assert.strictEqual(res.data.title, 'Payment Received');
    console.log('✔ Test 1 passed: Valid notification payload accepted');
  }

  // Test 2: Missing or empty userId
  {
    const invalidPayloads = [
      { userId: '', title: 'Valid Title', body: 'Valid Body Content' },
      { title: 'Valid Title', body: 'Valid Body Content' },
    ];

    for (const p of invalidPayloads) {
      const res = validateCreateNotification(p);
      assert.strictEqual(res.valid, false);
      assert.ok(res.error.includes('userId'));
    }
    console.log('✔ Test 2 passed: Missing or empty userId rejected');
  }

  // Test 3: Title too short (< 2 chars)
  {
    const res = validateCreateNotification({
      userId: 'usr_1',
      title: 'a',
      body: 'Valid Body Content',
    });
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('title'));
    console.log('✔ Test 3 passed: Short title rejected');
  }

  // Test 4: Body too short (< 2 chars)
  {
    const res = validateCreateNotification({
      userId: 'usr_1',
      title: 'Valid Title',
      body: 'x',
    });
    assert.strictEqual(res.valid, false);
    assert.ok(res.error.includes('body'));
    console.log('✔ Test 4 passed: Short body rejected');
  }

  // Test 5: Null / non-object payload
  {
    const res = validateCreateNotification(null);
    assert.strictEqual(res.valid, false);
    console.log('✔ Test 5 passed: Null payload rejected');
  }

  console.log('All notification validation tests passed successfully!');
}

runTests();
