const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage({ senderId, receiverId, body }) {
  const message = { id: `msg_${Date.now()}`, senderId, receiverId, body, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
