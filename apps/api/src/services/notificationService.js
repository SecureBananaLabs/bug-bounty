const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const notification = {
    id: `ntf_${Date.now()}`,
    read: false,
    userId: payload.userId,
    message: payload.message,
    type: payload.type ?? "info"
  };
  notifications.push(notification);
  return notification;
}
