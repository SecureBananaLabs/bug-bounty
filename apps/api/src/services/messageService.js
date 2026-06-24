const messages = [];

// Simple HTML entity encoder to prevent stored XSS
function sanitize(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  const message = {
    id: `msg_${Date.now()}`,
    ...payload,
    body: sanitize(payload.body),
    sentAt: new Date().toISOString()
  };
  messages.push(message);
  return message;
}
