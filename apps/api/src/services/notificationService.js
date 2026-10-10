const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { id: _ignoredId, read: _ignoredRead, ...rest } = payload;
  const notification = { id: `ntf_${Date.now()}`, read: false, ...rest };
  notifications.push(notification);
  return notification;
}
