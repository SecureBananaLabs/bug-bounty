import crypto from "node:crypto";

const notifications = [];

export async function listNotifications() {
  return [...notifications];
}

export async function createNotification(payload = {}) {
  const { id: _ignoredId, ...rest } = payload ?? {};
  const notification = {
    read: false,
    ...rest,
    id: `ntf_${crypto.randomUUID()}`
  };
  notifications.push(notification);
  return notification;
}
