const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  // Server-owned `createdAt` so caller-supplied values cannot control the
  // returned timestamp. Strip any incoming `createdAt` from the payload first
  // and assign the canonical ISO string at the storage boundary.
  const { createdAt: _ignoredCreatedAt, ...rest } = payload ?? {};
  const notification = {
    id: `ntf_${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString(),
    ...rest,
  };
  notifications.push(notification);
  return notification;
}
