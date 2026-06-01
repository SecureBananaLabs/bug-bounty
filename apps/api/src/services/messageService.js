const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  // Reject blank message content
  const body = payload?.body?.trim();
  if (!body) {
    throw Object.assign(new Error("Message body cannot be blank"), { statusCode: 400 });
  }

  const message = {
    id: `msg_${Date.now()}`,
    senderId: payload.senderId,
    receiverId: payload.receiverId,
    body,
    sentAt: new Date().toISOString()
  };
  messages.push(message);
  return message;
}
