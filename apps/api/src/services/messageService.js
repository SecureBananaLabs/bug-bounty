const messages = [];

export class SelfMessageError extends Error {
  constructor(userId) {
    super(`User ${userId} cannot send a message to themselves`);
    this.name = "SelfMessageError";
  }
}

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  if (
    payload?.senderId != null &&
    payload.senderId === payload.receiverId
  ) {
    throw new SelfMessageError(payload.senderId);
  }

  const message = { id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
