const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const notification = {
    id: `ntf_${Date.now()}`,
    read: false,
    message: payload.message ?? "",
    userId: payload.userId ?? null
  };
  notifications.push(notification);
  return notification;
}
