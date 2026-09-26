import { createServiceId } from "../utils/ids.js";

const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const notification = { ...payload, id: createServiceId("ntf"), read: false };
  notifications.push(notification);
  return notification;
}
