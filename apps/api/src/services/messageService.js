const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const message = {
    id: `msg_${Date.now()}`,
    content: payload.content,
    senderId: payload.senderId,
    receiverId: payload.receiverId,
    jobId: payload.jobId ?? null,
    sentAt: new Date().toISOString()
  };
  messages.push(message);
  return message;
}
