const messages = [];

export class SelfDirectedMessageError extends Error {
  constructor() {
    super("Messages require distinct sender and receiver");
    this.name = "SelfDirectedMessageError";
  }
}

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  if (payload?.senderId === payload?.receiverId) {
    throw new SelfDirectedMessageError();
  }

  const message = { id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
