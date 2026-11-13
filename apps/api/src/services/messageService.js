const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const message = { id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}

export async function getMessageById(id) {
  return messages.find((m) => m.id === id) || null;
}
