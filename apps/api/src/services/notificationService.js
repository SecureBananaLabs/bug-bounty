const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { id: _ignoredId, read: _ignoredRead, ...safePayload } = payload ?? {};
  const notification = { ...safePayload, id: `ntf_${Date.now()}`, read: false };
  notifications.push(notification);
  return notification;
}
