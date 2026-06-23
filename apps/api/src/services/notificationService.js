const notifications = [];

export async function listNotifications() {
  return notifications.map(n => ({ ...n }));
}

export async function createNotification(payload) {
  const notification = {
    id: `ntf_${Date.now()}`,
    read: false,
    ...(payload || {})
  };
  // Reject caller-supplied id and read to prevent injection
  delete notification.id;
  delete notification.read;
  notification.id = `ntf_${Date.now()}`;
  notification.read = false;
  notifications.push(notification);
  return { ...notification };
}
