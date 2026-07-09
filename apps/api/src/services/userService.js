const users = [];

export async function listUsers() {
  return users.map(u => {
    const { password, ...safe } = u;
    return safe;
  });
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  const { password, ...safe } = user;
  return safe;
}
