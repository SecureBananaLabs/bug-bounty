const notifications = [];

export async function listNotifications(userId) {
  if (userId) {
    return notifications.filter((n) => n.userId === userId);
  }
  return notifications;
}

export async function createNotification(payload) {
  const notification = { id: `ntf_${Date.now()}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}
