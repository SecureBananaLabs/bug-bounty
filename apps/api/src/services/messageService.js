const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const { recipientId, body } = payload;
  const message = {
    id: `msg_${Date.now()}`,
    recipientId,
    body,
    sentAt: new Date().toISOString()
  };
  messages.push(message);
  return message;
}
