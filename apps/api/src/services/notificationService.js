const notifications = [];

export async function listNotifications(userId) {
  if (!userId) {
    return [];
  }

  return notifications.filter((notification) => notification.userId === userId);
}

export async function createNotification(payload) {
  const notification = { id: `ntf_${Date.now()}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}
