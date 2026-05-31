const users = [];
const ALLOWED_FIELDS = ["email", "password", "name", "role"];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const sanitized = {};
  for (const field of ALLOWED_FIELDS) {
    if (payload[field] !== undefined) {
      sanitized[field] = payload[field];
    }
  }
  const user = { id: `usr_${Date.now()}`, ...sanitized };
  users.push(user);
  return user;
}
