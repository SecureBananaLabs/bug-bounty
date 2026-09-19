/**
 * @file notifications.test.js
 * Unit tests for notificationService batch mark-as-read functionality.
 */

import assert from 'assert';
import {
  createNotification,
  listNotifications,
  markAllAsRead,
  _resetNotificationsForTesting,
} from '../services/notificationService.js';

async function runTests() {
  console.log('Running notificationService unit tests...');

  _resetNotificationsForTesting();

  // Test 1: Empty state and invalid userId
  {
    const res1 = await markAllAsRead('');
    assert.deepStrictEqual(res1, { count: 0, updated: [] });

    const res2 = await markAllAsRead(null);
    assert.deepStrictEqual(res2, { count: 0, updated: [] });
    console.log('✔ Test 1 passed: Invalid userId handled safely');
  }

  // Test 2: Create notifications and mark user notifications as read
  {
    await createNotification({ userId: 'user_A', message: 'First notice' });
    await createNotification({ userId: 'user_A', message: 'Second notice' });
    await createNotification({ userId: 'user_B', message: 'Notice for user B' });

    const all = await listNotifications();
    assert.strictEqual(all.length, 3);

    const result = await markAllAsRead('user_A');
    assert.strictEqual(result.count, 2);
    assert.strictEqual(result.updated.length, 2);
    assert.strictEqual(result.updated[0].read, true);
    assert.ok(result.updated[0].readAt);
    assert.strictEqual(result.updated[1].read, true);
    assert.ok(result.updated[1].readAt);
    console.log('✔ Test 2 passed: Batch mark all as read for specific user');
  }

  // Test 3: Other user notifications remain unaffected (unread)
  {
    const all = await listNotifications();
    const userBNotification = all.find((n) => n.userId === 'user_B');
    assert.strictEqual(userBNotification.read, false);
    assert.strictEqual(userBNotification.readAt, null);
    console.log('✔ Test 3 passed: Multi-tenant user notification isolation');
  }

  // Test 4: Idempotency (calling markAllAsRead again returns 0 count when already read)
  {
    const repeatResult = await markAllAsRead('user_A');
    assert.strictEqual(repeatResult.count, 0);
    assert.deepStrictEqual(repeatResult.updated, []);
    console.log('✔ Test 4 passed: Idempotency when all items already marked as read');
  }

  console.log('All notification tests passed successfully!');
}

runTests();
