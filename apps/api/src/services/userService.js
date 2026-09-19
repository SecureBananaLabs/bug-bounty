const users = [];

export async function listUsers({ skip = 0, limit = 20 } = {}) {
  return { items: users.slice(skip, skip + limit), total: users.length };
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
