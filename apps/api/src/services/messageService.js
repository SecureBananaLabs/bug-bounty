const messages = [];

export async function listMessages() {
  // Callers trim or reorder the list they receive; hand back an independent
  // snapshot so the shared module array keeps every stored message.
  return [...messages];
}

export async function sendMessage(payload) {
  const message = { id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
