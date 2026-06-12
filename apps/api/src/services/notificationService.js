const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const notification = {
    id: `ntf_${Date.now()}`,
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    link: payload.link ?? null,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.push(notification);
  return notification;
}
