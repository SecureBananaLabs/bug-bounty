export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  // Server-set values FIRST, then spread payload (so server values take precedence)
  const notification = {
    id: `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    read: false,
    createdAt: new Date().toISOString(),
    ...payload,
  };
  notifications.push(notification);
  return notification;
}

export async function markAsRead(id, userId) {
  // Only allow marking own notifications as read
  const notification = notifications.find((n) => n.id === id && n.userId === userId);
  if (!notification) {
    return null;  // Return null when not found or unauthorized
  }
  notification.read = true;
  return notification;
}
