import { randomUUID } from "node:crypto";

const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  // Date.now() only has millisecond resolution, so a batch created in the same
  // tick reused one id for every record.
  const notification = { id: `ntf_${randomUUID()}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}
