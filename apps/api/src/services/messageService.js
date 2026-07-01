const messages = [];

export async function listMessages() {
  // Return shallow copy to prevent external mutation
  return [...messages];
}

export async function sendMessage(payload) {
  // Destructure to remove any client-provided id, then spread remaining fields
  const { id: _ignored, ...safePayload } = payload;
  const message = {
    id: `msg_${Date.now()}`,
    ...safePayload,
    sentAt: new Date().toISOString()
  };
  messages.push(message);
  // Return snapshot to prevent external mutation
  return { ...message };
}
