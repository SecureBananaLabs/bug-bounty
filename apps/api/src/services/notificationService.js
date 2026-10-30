import { randomUUID } from "node:crypto";

const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  // Date.now() only has millisecond resolution, so two records created in the
  // same tick used to collide on the same id.
  const notification = { id: `ntf_${randomUUID()}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}
