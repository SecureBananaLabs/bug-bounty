const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { userId, type, message: msg } = payload;
  const notification = { id: `ntf_${Date.now()}`, userId, type, message: msg, read: false };
  notifications.push(notification);
  return notification;
}