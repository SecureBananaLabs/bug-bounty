const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const userId = `usr_${Date.now()}`;
  const user = {
    id: userId,
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role,
    isVerified: false
  };
  users.push(user);
  return user;
}
