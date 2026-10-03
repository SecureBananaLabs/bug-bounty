const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { message, type, userId } = payload;
  const notification = {
    message,
    type,
    userId,
    id: `ntf_${Date.now()}`,
    read: false
  };
  notifications.push(notification);
  return notification;
}
