const notifications = [];

export async function listNotifications(actor = {}) {
  const actorId = actor?.sub;
  if (!actorId) {
    return [];
  }
  return notifications.filter((item) => item.userId === actorId);
}

export async function createNotification(payload, actor = {}) {
  const actorId = actor?.sub || "usr_unknown";
  const { id, read, ...data } = payload;
  const notification = {
    ...data,
    id: `ntf_${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString(),
    userId: actorId,
  };
  notifications.push(notification);
  return notification;
}
