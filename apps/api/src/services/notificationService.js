let counter = 0;
const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload = {}) {
  const { id: _ignoredId, read: _ignoredRead, ...cleanPayload } = payload;
  const uniqueSuffix = `${Date.now()}_${++counter}_${Math.random().toString(36).slice(2, 8)}`;
  const notification = {
    ...cleanPayload,
    id: `ntf_${uniqueSuffix}`,
    read: false,
  };
  notifications.push(notification);
  return notification;
}
