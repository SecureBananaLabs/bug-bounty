const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { read: _read, status: _status, ...safePayload } = payload ?? {};
  const notification = { id: `ntf_${Date.now()}`, ...safePayload, read: false };
  notifications.push(notification);
  return notification;
}
