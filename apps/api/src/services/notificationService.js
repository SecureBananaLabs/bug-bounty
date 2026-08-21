const notifications = [];

export async function listNotifications(userId) {
  if (userId) {
    return notifications.filter((n) => n.userId === userId);
  }
  return notifications;
}

export async function createNotification(payload) {
  const notification = { id: `ntf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}

export async function markAllAsRead(userId) {
  let updatedCount = 0;
  for (const n of notifications) {
    if (!userId || n.userId === userId) {
      if (!n.read) {
        n.read = true;
        updatedCount++;
      }
    }
  }
  return { success: true, updatedCount };
}
