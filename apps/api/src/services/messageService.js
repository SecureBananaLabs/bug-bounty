const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const message = {
    id: `msg_${Date.now()}`,
    senderId: payload.senderId,
    receiverId: payload.receiverId,
    content: payload.content
  };
  messages.push(message);
  return message;
}
