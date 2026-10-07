import { makeId } from "../utils/id.js";

const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload) {
  const notification = { id: makeId("ntf"), read: false, ...payload };
  notifications.push(notification);
  return notification;
}
