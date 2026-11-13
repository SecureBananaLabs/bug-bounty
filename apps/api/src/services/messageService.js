const messages = [];

export async function listMessages(userId) {
  return messages.filter(
    (message) => message.senderId === userId || message.receiverId === userId
  );
}

export async function sendMessage(payload, senderId) {
  const message = {
    id: `msg_${Date.now()}`,
    ...payload,
    senderId,
    sentAt: new Date().toISOString()
  };
  messages.push(message);
  return message;
}
