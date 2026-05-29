const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const { id: _ignored, ...safe } = payload;
  const message = { ...safe, id: `msg_${Date.now()}`, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
