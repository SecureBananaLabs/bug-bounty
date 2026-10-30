const messages = [];

function serializeMessage(message) {
  return { ...message };
}

export async function listMessages() {
  return messages.map(serializeMessage);
}

export async function sendMessage(payload) {
  const message = { id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return serializeMessage(message);
}
