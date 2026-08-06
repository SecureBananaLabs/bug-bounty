const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload, userId) {
  const notification = { id: `ntf_${Date.now()}`, read: false, ...payload, userId };
  notifications.push(notification);
  return notification;
}
