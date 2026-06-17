const notifications = [];

export async function listNotifications() {
  return notifications.map((n) => ({ ...n }));
}

export async function createNotification(payload) {
  const { id: _id, read: _read, ...safePayload } = payload;
  const notification = { id: `ntf_${Date.now()}`, read: false, ...safePayload };
  notifications.push(notification);
  return { ...notification };
}
