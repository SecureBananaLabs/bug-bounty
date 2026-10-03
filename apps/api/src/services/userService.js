const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = {
    id: `usr_${Date.now()}`,
    username: payload.username,
    email: payload.email,
  };
  users.push(user);
  return user;
}
