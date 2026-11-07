let notifications = [];

export async function listNotifications() {
  return [...notifications];
}

export async function getNotificationById(id) {
  return notifications.find((n) => n.id === id) || null;
}

export async function createNotification(payload) {
  const notification = { id: `ntf_${Date.now()}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}

export function _resetNotifications() {
  notifications = [];
}
