const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { id: _id, read: _read, ...clientPayload } = payload ?? {};
  const notification = { ...clientPayload, id: `ntf_${Date.now()}`, read: false };
  notifications.push(notification);
  return notification;
}
