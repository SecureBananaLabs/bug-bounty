<content>
const { v4: uuidv4 } = require('uuid');

// Define a Zod schema for safe payload creation
const createNotificationPayloadSchema = require('../validations/notificationValidation').createNotificationPayload;

function createNotification(payload) {
  // Validate and sanitize the payload
  const validatedPayload = createNotificationPayloadSchema.parse(payload);

  // Server-controlled fields are set first, then spread the validated payload.
  // This ensures server fields cannot be overridden by the client.
  const notification = {
    id: `ntf_${uuidv4()}`,
    read: false,
    ...validatedPayload,
  };

  // In a real app, you would then save this to your database
  // await db.collection('notifications').insertOne(notification);

  return notification;
}

function markAsRead(notificationId) {
  // In a real app, this would update the notification in the database
  // e.g., await db.collection('notifications').updateOne({ id: notificationId }, { $set: { read: true } });
  return { id: notificationId, read: true };
}

module.exports = {
  createNotification,
  markAsRead,
};
</content>