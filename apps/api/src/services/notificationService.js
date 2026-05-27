const notifications = [];

export async function listNotifications({ skip = 0, limit = 20 } = {}) {
  return { items: notifications.slice(skip, skip + limit), total: notifications.length };
}

export async function createNotification(payload) {
  const notification = { id: `ntf_${Date.now()}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}
