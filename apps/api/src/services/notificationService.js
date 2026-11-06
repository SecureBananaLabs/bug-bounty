import { randomUUID } from "node:crypto";

const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const notification = { id: `ntf_${randomUUID()}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}
