const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  // Generate server-side ID — do not allow client to override
  const user = {
    id: `usr_${Date.now()}`,
    email: payload.email,
    name: payload.name,
    role: payload.role || "client"
  };
  users.push(user);
  return user;
}
