const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    username: payload.username,
    role: payload.role ?? "client"
  };
  users.push(user);
  return user;
}
