const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  // eslint-disable-next-line no-unused-vars
  const { id: _id, read: _read, ...safe } = payload;
  const notification = { id: `ntf_${Date.now()}`, read: false, ...safe, createdAt: new Date().toISOString() };
  notifications.push(notification);
  return notification;
}
