const messages = [];

export async function listMessages() {
  return messages.map((message) => ({ ...message }));
}

export async function sendMessage(payload) {
  const message = {
    ...payload,
    id: `msg_${Date.now()}`,
    sentAt: new Date().toISOString()
  };
  messages.push(message);
  return { ...message };
}
