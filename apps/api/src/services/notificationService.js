import { randomUUID } from "node:crypto";

const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  // Date.now() only has millisecond resolution, so two notifications created in
  // the same tick used to share an id and overwrite each other in the store.
  const notification = { id: `ntf_${randomUUID()}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}
