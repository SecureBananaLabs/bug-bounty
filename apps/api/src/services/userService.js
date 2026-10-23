const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    name: payload.name
  };
  users.push(user);
  return user;
}
