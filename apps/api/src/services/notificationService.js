const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { id: _id, read: _read, ...fields } =
    payload && typeof payload === "object" ? payload : {};
  const notification = { ...fields, id: `ntf_${Date.now()}`, read: false };
  notifications.push(notification);
  return notification;
}
