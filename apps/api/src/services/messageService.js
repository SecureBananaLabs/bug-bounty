const messages = [];

export async function listMessages() {
  // Return a shallow copy — callers cannot mutate the in-memory store.
  return [...messages];
}

export async function sendMessage(payload) {
  // Server-controlled fields must come AFTER the spread so the client
  // cannot override them. The id was previously BEFORE the spread,
  // allowing a client to supply their own message ID via the request body.
  const message = {
    ...payload,
    id: `msg_${Date.now()}`,
    sentAt: new Date().toISOString()
  };
  messages.push(message);
  return message;
}
