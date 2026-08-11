const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  // eslint-disable-next-line no-unused-vars
  const { id: _id, ...safe } = payload;
  const message = { id: `msg_${Date.now()}`, ...safe, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
