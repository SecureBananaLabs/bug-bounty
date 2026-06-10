const messages = [];

export async function listMessages(userId) {
  return messages.filter(
    (m) => m.recipientId === userId || m.senderId === userId
  );
}

export async function sendMessage(payload) {
  const message = { id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
