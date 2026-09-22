const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const { senderId, receiverId, content } = payload;
  const message = { id: `msg_${Date.now()}`, senderId, receiverId, content, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
