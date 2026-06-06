const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  // Fix #5201: Prevent caller from overriding server-generated id
  const { id: _ignored, ...safePayload } = payload;
  const user = { id: `usr_${Date.now()}`, ...safePayload };
  users.push(user);
  return user;
}
