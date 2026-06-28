let nextId = 1;

export async function createNotification(payload) {
  const notification = {
    id: `notif_${nextId++}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...payload,
  };
  return notification;
}

export async function getNotifications() {
  return [];
}

export async function markAsRead(notificationId) {
  return { id: notificationId, read: true };
}
