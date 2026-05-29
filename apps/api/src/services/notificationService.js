const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { id: _ignored, ...safe } = payload;
  const notification = { ...safe, id: `ntf_${Date.now()}`, read: false };
  notifications.push(notification);
  return notification;
}
