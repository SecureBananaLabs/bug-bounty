const messages = [];
let messageCounter = 0;

function generateMessageId() {
  messageCounter++;
  return `msg_${Date.now()}_${messageCounter}`;
}

/** @internal Test-only: clear all stored messages */
export function _reset() {
  messages.length = 0;
}

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload = {}) {
  const message = {
    ...payload,
    id: generateMessageId(),
    sentAt: new Date().toISOString(),
  };
  messages.push(message);
  return message;
}
