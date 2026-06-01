const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload, actor = {}) {
  const actorId = actor?.sub || "usr_unknown";
  const { id, read, ...data } = payload;
  const notification = {
    ...data,
    id: `ntf_${Date.now()}`,
    read: false,
    userId: actorId,
  };
  notifications.push(notification);
  return notification;
}
