const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const { isRead: _ignoredIsRead, sentAt: _ignoredSentAt, createdAt: _ignoredCreatedAt, ...safePayload } =
    payload ?? {};
  const message = {
    id: `msg_${Date.now()}`,
    ...safePayload,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  messages.push(message);
  return message;
}

export function resetMessagesForTests() {
  messages.length = 0;
}
