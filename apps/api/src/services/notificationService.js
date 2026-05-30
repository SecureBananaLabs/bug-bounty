const notifications = [];

export async function listNotifications({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  return {
    data: notifications.slice(offset, offset + limit),
    total: notifications.length,
    page,
    limit,
    totalPages: Math.ceil(notifications.length / limit),
  };
}

export async function createNotification(payload) {
  const notification = { id: `ntf_${Date.now()}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}
