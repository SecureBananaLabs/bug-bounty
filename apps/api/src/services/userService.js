const users = [];

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function listUsers() {
  return users.map(sanitizeUser);
}

export async function createUser(payload) {
  const { password, ...safePayload } = payload;
  const user = { id: `usr_${Date.now()}`, ...safePayload };
  users.push(user);
  return sanitizeUser(user);
}
