const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const notification = {
    id: `ntf_${Date.now()}`,
    message: payload.message,
    userId: payload.userId,
    read: false,
  };
  notifications.push(notification);
  return notification;
}
