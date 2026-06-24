const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { id: _ignoredId, read: _ignoredRead, userId: _ignoredUserId, title: _ignoredTitle, body: _ignoredBody, ...safePayload } = payload || {};
  const notification = { id: `ntf_${Date.now()}`, read: false, ...safePayload };
  notifications.push(notification);
  return notification;
}
