const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const message = {
    ...payload,
    id: `msg_${Date.now()}`,
    sentAt: new Date().toISOString()
  };
  messages.push(message);
  return message;
}

export function resetMessages() {
  messages.length = 0;
}
