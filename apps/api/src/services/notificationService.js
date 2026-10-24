import { createId } from "../utils/ids.js";

const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const { id, read, ...notificationPayload } = payload;
  const notification = { ...notificationPayload, id: createId("ntf"), read: false };
  notifications.push(notification);
  return notification;
}

export function resetNotifications() {
  notifications.length = 0;
}
