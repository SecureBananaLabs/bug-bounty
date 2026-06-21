const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  // Server controls these fields — never trust client input
  const message = {
    id: `msg_${Date.now()}`,
    sentAt: new Date().toISOString(),
    ...payload,
  };
  messages.push(message);
  return message;
}
