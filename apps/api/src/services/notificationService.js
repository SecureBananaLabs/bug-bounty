import crypto from "node:crypto";

const notifications = [];

export async function listNotifications() {
  return [...notifications];
}

export async function createNotification(payload = {}) {
  const safePayload =
    payload !== null && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
  const { id: _ignoredId, ...rest } = safePayload;
  const notification = {
    read: false,
    ...rest,
    id: `ntf_${crypto.randomUUID()}`
  };
  notifications.push(notification);
  return notification;
}
