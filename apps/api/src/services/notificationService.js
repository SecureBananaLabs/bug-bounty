import { createEntityId } from "../utils/ids.js";

const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const notification = { id: createEntityId("ntf"), read: false, ...payload };
  notifications.push(notification);
  return notification;
}
