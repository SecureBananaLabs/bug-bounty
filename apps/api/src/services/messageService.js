const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const { content, senderId, receiverId, jobId } = payload;
  const message = { id: `msg_${Date.now()}`, content, senderId, receiverId, jobId, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
