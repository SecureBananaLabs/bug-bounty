const messages = [];

export async function listMessages() {
  return messages.map(m => ({ ...m }));
}

export async function sendMessage(payload) {
  const { recipientId, content } = payload;
  const message = { id: `msg_${Date.now()}`, recipientId, content, sentAt: new Date().toISOString() };
  messages.push(message);
  return { ...message };
}
