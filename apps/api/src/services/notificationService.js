/**
 * Notification Service
 * 
 * Fix #2762: Preserve server-owned id and read state during creation.
 * Caller-supplied `id` and `read` fields are now ignored.
 */

const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  // Strip any caller-supplied id and read fields to ensure
  // the server always owns these values.
  const { id: _ignoredId, read: _ignoredRead, ...safePayload } = payload || {};
  
  const notification = {
    id: `ntf_${Date.now()}`,
    read: false,
    ...safePayload,
  };
  
  notifications.push(notification);
  return notification;
}
