const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { id: _ignoredId, read: _ignoredRead, ...clientFields } = payload ?? {};
  const notification = { ...clientFields, id: `ntf_${Date.now()}`, read: false };
  notifications.push(notification);
  return notification;
}
