const notifications = [];

export async function listNotifications() {
  return [...notifications].map(item => ({...item}));
}

export async function createNotification(payload) {
  const notification = { id: `ntf_${Date.now()}`, read: false, ...payload };
  notifications.push(notification);
  return notification;
}
