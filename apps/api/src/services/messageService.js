const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const { id, ...rest } = payload;
  const message = { ...rest, id: `msg_${Date.now()}`, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
