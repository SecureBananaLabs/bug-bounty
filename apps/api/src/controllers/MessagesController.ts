// ...

// Change the order of the spread to prioritize server-generated fields
const message = {
  id: `msg_${Date.now()}`,
  sentAt: new Date().toISOString(),
  ...payload,
};

// ...