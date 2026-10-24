const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(senderId, content) {
  const message = {
    id: `msg_${Date.now()}`,
    senderId,
    content,
    sentAt: new Date().toISOString()
  };
  messages.push(message);
  return message;
}
