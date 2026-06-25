const users = [];

export async function listUsers() {
  return users.map(u => omitPassword(u));
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return omitPassword(user);
}

function omitPassword(user) {
  const { password, passwordHash, ...rest } = user;
  return rest;
}
