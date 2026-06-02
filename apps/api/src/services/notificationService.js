const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  // Server owns id and read state - ignore client-provided values
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
