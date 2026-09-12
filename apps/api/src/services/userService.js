const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = {
    id: `usr_${Date.now()}`,
    status: "active",
    role: payload.role || "freelancer",
    trustScore: 50,
    createdAt: new Date().toISOString(),
    ...payload,
  };
  users.push(user);
  return user;
}

export async function findUserById(id) {
  return users.find((u) => u.id === id) || null;
}

export async function updateUserStatus(id, status) {
  const user = users.find((u) => u.id === id);
  if (!user) return null;
  user.status = status;
  user.updatedAt = new Date().toISOString();
  return user;
}
