const users = [];

export async function listUsers() {
  return users;
}

const ALLOWED_USER_FIELDS = ["username", "email", "bio", "avatarUrl"];

export async function createUser(payload) {
  const sanitized = {};
  for (const field of ALLOWED_USER_FIELDS) {
    if (payload[field] !== undefined) {
      sanitized[field] = payload[field];
    }
  }
  const user = { id: `usr_${Date.now()}`, ...sanitized };
  users.push(user);
  return user;
}
