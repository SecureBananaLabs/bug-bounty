const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const createdAt = new Date().toISOString();
  const message = {
    id: `msg_${Date.now()}`,
    ...payload,
    createdAt,
    sentAt: createdAt,
  };
  messages.push(message);
  return message;
}
