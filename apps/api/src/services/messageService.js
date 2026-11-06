const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  // The id and the timestamp are owned by the server: applying the payload
  // afterwards let a caller pin an arbitrary id (or sentAt) on the record.
  const message = {
    ...payload,
    id: `msg_${Date.now()}`,
    sentAt: new Date().toISOString()
  };
  messages.push(message);
  return message;
}
