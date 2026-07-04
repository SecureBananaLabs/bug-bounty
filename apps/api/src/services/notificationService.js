const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { userId, type, message } = payload;
  const notification = {
    id: `ntf_${Date.now()}`,
    userId,
    type,
    message,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(notification);
  return notification;
}
