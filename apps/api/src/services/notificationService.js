import { createId } from "../utils/id.js";

const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const notification = { id: createId("ntf"), read: false, ...payload };
  notifications.push(notification);
  return notification;
}
