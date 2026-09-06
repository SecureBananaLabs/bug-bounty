const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  if (!payload.receiverId) {
    throw new Error("receiverId is required");
  }
  const message = { id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
