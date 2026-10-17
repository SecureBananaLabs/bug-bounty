import { createPublicId } from "../utils/publicId.js";

const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const notification = { id: createPublicId("ntf"), read: false, ...payload };
  notifications.push(notification);
  return notification;
}
