const users = [];

function serializeUser(user) {
  return { ...user };
}

export async function listUsers() {
  return users.map(serializeUser);
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return serializeUser(user);
}
