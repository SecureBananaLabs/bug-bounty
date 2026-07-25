const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  // Strip dangerous fields before spread, then apply server-generated values last
  const { id: _id, sentAt: _sentAt, ...safePayload } = payload;
  const message = {
    ...safePayload,
    id: `msg_${Date.now()}`,
    sentAt: new Date().toISOString(),
  };
  messages.push(message);
  return message;
}
