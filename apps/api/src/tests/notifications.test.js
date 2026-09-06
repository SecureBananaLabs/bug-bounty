import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createNotification, listNotifications, markAllAsRead } from '../services/notificationService.js';

describe('Notification Service', () => {
  it('marks all unread notifications for a user as read', async () => {
    const userA = 'user_111';
    const userB = 'user_222';

    await createNotification({ userId: userA, title: 'Alert 1', body: 'Body 1' });
    await createNotification({ userId: userA, title: 'Alert 2', body: 'Body 2' });
    await createNotification({ userId: userB, title: 'Alert 3', body: 'Body 3' });

    const res = await markAllAsRead(userA);
    assert.equal(res.success, true);
    assert.equal(res.updatedCount, 2);

    const userANotifs = await listNotifications(userA);
    assert.equal(userANotifs.every((n) => n.read === true), true);

    const userBNotifs = await listNotifications(userB);
    assert.equal(userBNotifs.some((n) => n.read === false), true);
  });
});
