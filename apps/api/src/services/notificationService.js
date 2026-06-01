const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { read, ...notificationPayload } = payload;
  const notification = {
    id: `ntf_${Date.now()}`,
    ...notificationPayload,
    read: false
  };
  notifications.push(notification);
  return notification;
}
