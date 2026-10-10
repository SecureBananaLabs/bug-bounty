const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const { id: _ignoredId, ...clientFields } = payload ?? {};
  const message = { ...clientFields, id: `msg_${Date.now()}`, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
