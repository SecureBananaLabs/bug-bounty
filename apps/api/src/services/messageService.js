const messages = [];
const ALLOWED_FIELDS = ["receiverId", "subject", "body"];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const sanitized = {};
  for (const field of ALLOWED_FIELDS) {
    if (payload[field] !== undefined) {
      sanitized[field] = payload[field];
    }
  }
  const message = { id: `msg_${Date.now()}`, ...sanitized };
  messages.push(message);
  return message;
}
