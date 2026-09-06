const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const notification = { ...payload, id: `ntf_${Date.now()}`, read: false };
  notifications.push(notification);
  return notification;
}
