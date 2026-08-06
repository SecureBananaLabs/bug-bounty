const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload, senderId) {
  const message = { id: `msg_${Date.now()}`, ...payload, senderId, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
