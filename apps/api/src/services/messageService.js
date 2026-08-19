const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const { id: _callerId, ...safePayload } = payload;
  const message = { id: `msg_${Date.now()}`, ...safePayload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
