import { snapshotList } from "./listSnapshot.js";

const notifications = [];

export async function listNotifications() {
  return snapshotList(notifications);
}

export async function createNotification(payload) {
  const notification = { id: `ntf_${Date.now()}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}
