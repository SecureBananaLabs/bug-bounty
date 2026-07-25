const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  // Server-generated fields placed AFTER spread to prevent client override
  const { id: _id, read: _read, ...safePayload } = payload;
  const notification = {
    ...safePayload,
    id: `ntf_${Date.now()}`,
    read: false,
  };
  notifications.push(notification);
  return notification;
}
