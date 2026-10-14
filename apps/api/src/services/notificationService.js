const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  // Server-owned fields take precedence — spread payload first, then override
  const notification = {
    ...payload,
    id: `ntf_${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.push(notification);
  return notification;
}
