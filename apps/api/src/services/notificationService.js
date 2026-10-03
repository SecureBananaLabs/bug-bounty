const notifications = [];

export async function listNotifications() {
  return notifications;
}

export async function createNotification(validatedData) {
  const notification = {
    id: `ntf_${Date.now()}`,
    read: false,
    type: validatedData.type,
    message: validatedData.message,
    recipientId: validatedData.recipientId,
    createdAt: new Date().toISOString()
  };
  notifications.push(notification);
  return notification;
}
