const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  // Server-owned `createdAt` so caller-supplied values cannot control the
  // returned timestamp. Strip any incoming `createdAt` from the payload first
  // and assign the canonical ISO string at the storage boundary.
  const { createdAt: _ignoredCreatedAt, ...rest } = payload ?? {};
  const user = {
    id: `usr_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...rest,
  };
  users.push(user);
  return user;
}
