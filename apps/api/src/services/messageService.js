const messages = [];

export async function listMessages() {
  return messages;
}

export async function sendMessage(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Request body is required');
  }
  
  const { receiverId, content } = payload;
  
  if (!receiverId || typeof receiverId !== 'string') {
    throw new Error('receiverId is required and must be a string');
  }
  
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('content is required and must be a non-empty string');
  }
  
  if (content.length > 5000) {
    throw new Error('content must be 5000 characters or less');
  }
  
  const message = {
    id: `msg_${Date.now()}`,
    receiverId,
    content: content.trim(),
    sentAt: new Date().toISOString()
  };
  
  messages.push(message);
  return message;
}
