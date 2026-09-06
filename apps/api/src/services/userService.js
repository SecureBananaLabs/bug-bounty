const users = [];

export async function listUsers() {
  return users.map((u) => ({ ...u }));
}

export async function createUser(payload) {
  const { id: _id, ...safePayload } = payload;
  const user = { id: `usr_${Date.now()}`, ...safePayload };
  users.push(user);
  return { ...user };
}
