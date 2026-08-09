const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}

export async function updateUserRole(userId, newRole) {
  const ALLOWED_ROLES = ["client", "freelancer", "admin"];
  if (!newRole || typeof newRole !== "string" || !ALLOWED_ROLES.includes(newRole.toLowerCase())) {
    const error = new Error(`Invalid role. Allowed roles are: ${ALLOWED_ROLES.join(", ")}`);
    error.status = 400;
    throw error;
  }

  const user = users.find((u) => u.id === userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  user.role = newRole.toLowerCase();
  return user;
}
