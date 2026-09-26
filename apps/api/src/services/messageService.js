const messages = [];

export async function listMessages(userId) {
  return messages.filter(
    (message) => message.senderId === userId || message.recipientId === userId
  );
}

export async function sendMessage(payload) {
  const message = { id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
