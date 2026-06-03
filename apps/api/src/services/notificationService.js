const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  if (!payload.message || typeof payload.message !== "string" || payload.message.trim().length === 0) {
    const err = new Error("Message is required and must be a non-blank string");
    err.status = 400;
    throw err;
  }
  const notification = { id: `ntf_${Date.now()}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}
