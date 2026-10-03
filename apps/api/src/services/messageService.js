<content>
const sendMessage = (payload) => {
  const serverGeneratedId = `msg_${Date.now()}`;
  const serverGeneratedSentAt = new Date().toISOString();
  
  // Ensure server-generated id and sentAt cannot be overridden
  const message = {
    id: serverGeneratedId,
    sentAt: serverGeneratedSentAt,
    ...payload // Spread user payload after setting server values
  };
  
  return message;
};

module.exports = {
  sendMessage
};
</content>