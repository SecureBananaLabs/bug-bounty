const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { id: _id, read: _read, ...safe } = payload;
  const notification = { id: `ntf_${Date.now()}`, read: false, ...safe };
  notifications.push(notification);
  return notification;
}
