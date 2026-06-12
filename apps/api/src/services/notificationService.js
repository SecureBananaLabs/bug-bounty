const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { id, read, ...notificationPayload } = payload;
  const notification = { ...notificationPayload, id: `ntf_${Date.now()}`, read: false };
  notifications.push(notification);
  return notification;
}
