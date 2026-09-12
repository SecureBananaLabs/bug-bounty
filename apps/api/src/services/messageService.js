const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const message = {
    id: `msg_${Date.now()}`,
    ...payload,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  messages.push(message);
  return message;
}
