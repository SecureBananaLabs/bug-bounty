import { createResourceId } from "../utils/id.js";

const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const notification = { ...payload, id: createResourceId("ntf"), read: false };
  notifications.push(notification);
  return notification;
}
