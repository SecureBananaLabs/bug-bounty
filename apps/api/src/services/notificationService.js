const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const createdAt = new Date().toISOString();
  const notification = { ...payload, id: `ntf_${Date.now()}`, read: false, createdAt };
  notifications.push(notification);
  return notification;
}
