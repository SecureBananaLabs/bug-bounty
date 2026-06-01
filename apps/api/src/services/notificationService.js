const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  // Use server-owned ID, not client-provided
  const notification = {
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    read: false,
    createdAt: new Date().toISOString(),
    ...payload,
  };
  notifications.push(notification);
  return notification;
}

export async function markAsRead(id) {
  const notification = notifications.find((n) => n.id === id);
  if (notification) notification.read = true;
  return notification;
}
