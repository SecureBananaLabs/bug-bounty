const { v4: uuidv4 } = require('uuid');

/**
 * Creates a new message with server-generated id and sentAt.
 * Caller-supplied id is ignored to prevent spoofing.
 *
 * @param {Object} payload - The message payload from the caller.
 * @returns {Object} The created message object.
 */
function sendMessage(payload) {
  // Ensure id is always server-generated; ignore any caller-supplied id
  const { id: _ignoredId, ...cleanPayload } = payload;

  const message = {
    id: `msg_${Date.now()}_${uuidv4().slice(0, 8)}`,
    ...cleanPayload,
    sentAt: new Date().toISOString(),
  };

  // Persist message (simulated for now)
  // In production, this would call a database or queue
  console.log('Message created:', message.id);

  return message;
}

module.exports = { sendMessage };
