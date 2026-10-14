const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  // Server-controlled fields (id, read) must come AFTER the spread so they
  // cannot be overridden by client input. Previously read:false was before
  // the spread, allowing callers to pre-mark notifications as read:true on
  // creation, defeating the unread notification system entirely.
  const notification = { ...payload, id: `ntf_${Date.now()}`, read: false };
  notifications.push(notification);
  return notification;
}

