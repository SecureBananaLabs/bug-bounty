const messages = [];

export async function listMessages({ skip = 0, limit = 20 } = {}) {
  return { items: messages.slice(skip, skip + limit), total: messages.length };
}

export async function sendMessage(payload) {
  const message = { id: `msg_${Date.now()}`, ...payload, sentAt: new Date().toISOString() };
  messages.push(message);
  return message;
}
