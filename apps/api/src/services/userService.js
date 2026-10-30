const users = [];
const SENSITIVE_USER_FIELDS = new Set(["password", "passwordHash", "token", "refreshToken"]);

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...stripSensitiveUserFields(payload) };
  users.push(user);
  return user;
}

function stripSensitiveUserFields(payload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => !SENSITIVE_USER_FIELDS.has(key))
  );
}
