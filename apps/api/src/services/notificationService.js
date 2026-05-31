const notifications = [];

const ALLOWED_FIELDS = ["title", "message", "type"];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const sanitized = {};
  for (const field of ALLOWED_FIELDS) {
    if (payload[field] !== undefined) {
      sanitized[field] = payload[field];
    }
  }
  const notification = { id: `ntf_${Date.now()}`, read: false, ...sanitized };
  notifications.push(notification);
  return notification;
}
