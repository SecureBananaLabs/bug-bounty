const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { id, read, ...data } = payload;
  const notification = {
    ...data,
    id: `ntf_${Date.now()}`,
    read: false,
  };
  notifications.push(notification);
  return notification;
}
