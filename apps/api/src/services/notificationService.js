/**
 * @file notificationService.js
 * In-memory notification storage service with batch mark-as-read support.
 */

'use strict';

const notifications = [];

/**
 * Lists all notifications.
 * @returns {Promise<Array>}
 */
export async function listNotifications() {
  return [...notifications];
}

/**
 * Creates and stores a new notification.
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export async function createNotification(payload) {
  const notification = {
    id: `ntf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    read: false,
    readAt: null,
    createdAt: new Date().toISOString(),
    ...payload,
  };
  notifications.push(notification);
  return notification;
}

/**
 * Marks all unread notifications for a specified user as read in batch.
 *
 * @param {string} userId - ID of the target user.
 * @returns {Promise<{ count: number, updated: Array }>}
 */
export async function markAllAsRead(userId) {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return { count: 0, updated: [] };
  }

  const trimmedId = userId.trim();
  const updated = [];
  const timestamp = new Date().toISOString();

  for (const ntf of notifications) {
    if (ntf.userId === trimmedId && !ntf.read) {
      ntf.read = true;
      ntf.readAt = timestamp;
      updated.push(ntf);
    }
  }

  return {
    count: updated.length,
    updated,
  };
}

/**
 * Clears the notification store (primarily for unit tests).
 */
export function _resetNotificationsForTesting() {
  notifications.length = 0;
}
