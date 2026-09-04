const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const message = {
    id: `msg_${Date.now()}`,
    content: payload.content,
    recipientId: payload.recipientId,
    jobId: payload.jobId,
    sentAt: new Date().toISOString()
  };
  messages.push(message);
  return message;
}
