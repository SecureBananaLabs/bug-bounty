const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const notification = { id: `ntf_${Date.now()}`, read: false, ...payload, createdAt: new Date().toISOString() };
  notifications.push(notification);
  return notification;
}
