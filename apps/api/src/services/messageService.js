<content>
const { v4: uuidv4 } = require('uuid');

// Define a Zod schema for safe payload creation
const createMessagePayloadSchema = require('../validations/messageValidation').createMessagePayload;

function sendMessage(payload) {
  // Validate and sanitize the payload
  const validatedPayload = createMessagePayloadSchema.parse(payload);

  // Server-controlled fields are set first, then spread the validated payload.
  // This ensures server fields cannot be overridden by the client.
  const message = {
    id: `msg_${uuidv4()}`,
    ...validatedPayload,
    sentAt: new Date().toISOString(),
  };

  // In a real app, you would then save this to your database
  // await db.collection('messages').insertOne(message);

  return message;
}

function getMessagesByUserId(userId) {
  // In a real app, this would query the database
  // e.g., const messages = await db.collection('messages').find({ userId }).toArray();
  return [];
}

module.exports = {
  sendMessage,
  getMessagesByUserId,
};
</content>