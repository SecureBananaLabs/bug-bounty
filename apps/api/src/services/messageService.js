const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const { id: _id, sentAt: _sentAt, ...safe } = payload;
  const message = { id: `msg_${Date.now()}`, ...safe, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
