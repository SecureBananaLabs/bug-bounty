const users = [];

const SENSITIVE_USER_FIELDS = new Set([
  "password",
  "passwordHash",
  "password_hash"
]);

function removeSensitiveFields(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => !SENSITIVE_USER_FIELDS.has(key))
  );
}

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const sanitizedPayload = removeSensitiveFields(payload);

  const user = {
    id: `usr_${Date.now()}`,
    ...sanitizedPayload
  };

  users.push(user);

  return user;
}
