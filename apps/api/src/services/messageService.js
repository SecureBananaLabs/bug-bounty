const messages = [];

function snapshotMessage(message) {
  return { ...message };
}

export async function listMessages() {
  return messages.map(snapshotMessage);
}

export async function sendMessage(payload) {
  const message = { ...payload, id: `msg_${Date.now()}`, sentAt: new Date().toISOString() };
  messages.push(message);
  return snapshotMessage(message);
}
