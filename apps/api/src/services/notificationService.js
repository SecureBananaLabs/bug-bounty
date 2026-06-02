const notifications = [];

export async function listNotifications() {
  return [...notifications]; // Defensive copy
}

export async function createNotification(payload) {
  const notification = {
    id: `ntf_${Date.now()}`,
    read: false,
    ...payload
  };
  // Ensure server-owned fields are never overridden
  notification.id = `ntf_${Date.now()}`;
  notification.read = false;
  notifications.push(notification);
  return notification;
}
