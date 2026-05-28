const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const { senderId, receiverId, content } = payload;
  const message = {
    senderId,
    receiverId,
    content,
    id: `msg_${Date.now()}`,
    sentAt: new Date().toISOString(),
  };
  messages.push(message);
  return message;
}
