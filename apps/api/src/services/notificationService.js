const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { id: _ignoredId, read: _ignoredRead, ...clientPayload } =
    payload && typeof payload === "object" ? payload : {};
  const notification = { ...clientPayload, id: `ntf_${Date.now()}`, read: false };
  notifications.push(notification);
  return notification;
}
