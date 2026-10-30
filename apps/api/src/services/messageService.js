const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const { id: _ignored, sentAt: _ignored2, ...safe } = payload;
  const message = { id: `msg_${Date.now()}`, ...safe, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
