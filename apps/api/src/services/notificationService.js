const notifications = [];

export async function listNotifications() {
  return notifications.map(n => ({ ...n }));
}

export async function createNotification(payload) {
  const { userId, message } = payload;
  const notification = { id: `ntf_${Date.now()}`, userId, message, read: false };
  notifications.push(notification);
  return { ...notification };
}
