const users = [];
const SENSITIVE_USER_FIELDS = new Set([
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken"
]);

function serializeUser(user) {
  return Object.fromEntries(
    Object.entries(user).filter(([key]) => !SENSITIVE_USER_FIELDS.has(key))
  );
}

export async function listUsers() {
  return users.map(serializeUser);
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return serializeUser(user);
}
