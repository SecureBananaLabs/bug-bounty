const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const notification = {
    id: `ntf_${Date.now()}`,
    userId: payload.userId,
    type: payload.type,
    message: payload.message,
    read: false
  };
  notifications.push(notification);
  return notification;
}
