const messages = [];

export class MessageValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "MessageValidationError";
  }
}

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  if (payload?.senderId && payload.senderId === payload.receiverId) {
    throw new MessageValidationError("Messages require distinct sender and receiver");
  }

  const message = { id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
