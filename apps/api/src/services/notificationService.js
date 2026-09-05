const notifications = [];
let notificationCounter = 0;

/**
 * Generate a unique notification ID, safe for same-millisecond calls.
 * @returns {string} Unique notification ID
 */
function generateNotificationId() {
  notificationCounter++;
  return `ntf_${Date.now()}_${notificationCounter}`;
}

export async function listNotifications() {
  return notifications;
}

export async function createNotification(payload = {}) {
  // Spread payload first, then server-controlled fields override
  const notification = {
    ...payload,
    id: generateNotificationId(),
    read: false,
  };
  notifications.push(notification);
  return notification;
}
