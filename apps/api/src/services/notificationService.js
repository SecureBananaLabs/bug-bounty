const notifications = [];

export async function listNotifications() {
  return notifications;
}

const ALLOWED_NOTIFICATION_FIELDS = ["userId", "type", "message", "link"];

export async function createNotification(payload) {
  const sanitized = {};
  for (const field of ALLOWED_NOTIFICATION_FIELDS) {
    if (payload[field] !== undefined) {
      sanitized[field] = payload[field];
    }
  }
  const notification = { id: `ntf_${Date.now()}`, read: false, ...sanitized };
  notifications.push(notification);
  return notification;
}
