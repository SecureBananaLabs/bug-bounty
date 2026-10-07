const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload, user) {
  const message = {
    ...payload,
    id: `msg_${Date.now()}`,
    senderId: user.sub,
    sentAt: new Date().toISOString()
  };
  messages.push(message);
  return message;
}
