const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { message, type, userId } = payload;
  const notification = { id: `ntf_${Date.now()}`, read: false, message, type, userId };
  notifications.push(notification);
  return notification;
}
