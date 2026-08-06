const users = [];

function withoutPassword(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function listUsers() {
  return users.map(withoutPassword);
}

export async function createUser(payload) {
  const { password, ...safePayload } = payload;
  const user = { id: `usr_${Date.now()}`, ...safePayload };
  users.push(user);
  return withoutPassword(user);
}
