const messages = [];

export async function listMessages() {
  // Callers sort or splice what they get back, so hand them a snapshot instead
  // of the array the service itself keeps appending to.
  return [...messages];
}

export async function sendMessage(payload) {
  const message = { id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
