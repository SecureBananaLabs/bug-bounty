// Whitelisted fields — service will only store these
const NOTIFICATION_FIELDS = ["userId", "title", "body", "type"];

const notifications = [];

export async function listNotifications() {
  return notifications.map(n => ({ ...n }));
}

export async function createNotification(payload) {
  // Defense in depth: only copy whitelisted fields, drop everything else
  const safe = {};
  for (const field of NOTIFICATION_FIELDS) {
    if (field in payload) safe[field] = payload[field];
  }
  const notification = { id: `ntf_${Date.now()}`, read: false, createdAt: new Date().toISOString(), ...safe };
  notifications.push(notification);
  return { ...notification };
}
