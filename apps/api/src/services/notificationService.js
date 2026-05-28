import crypto from "crypto";
const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const notification = { id: `${m.group(1)}_${crypto.randomUUID()}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}
