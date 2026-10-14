const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { id: _callerId, read: _callerRead, ...safePayload } = payload;
  const notification = { id: `ntf_${Date.now()}`, read: false, ...safePayload };
  notifications.push(notification);
  return notification;
}
