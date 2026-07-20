const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage({ text, recipientId }) {
  const message = {
    id: `msg_${Date.now()}`,
    text,
    ...(recipientId ? { recipientId } : {}),
    sentAt: new Date().toISOString()
  };
  messages.push(message);
  return message;
}
