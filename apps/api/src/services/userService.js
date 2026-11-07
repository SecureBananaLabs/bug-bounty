const users = [];

const PRIVATE_USER_FIELDS = new Set([
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "resetToken",
  "apiKey"
]);

function publicUserPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => !PRIVATE_USER_FIELDS.has(key))
  );
}

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...publicUserPayload(payload) };
  users.push(user);
  return user;
}
