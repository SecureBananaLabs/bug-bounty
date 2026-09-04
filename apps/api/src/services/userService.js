const users = [];

export async function listUsers() {
  return users;
}

const SECRET_USER_FIELDS = ["password", "passwordHash", "password_hash"];

function stripSecrets(payload) {
  const safe = { ...payload };
  for (const key of SECRET_USER_FIELDS) {
    if (key in safe) {
      delete safe[key];
    }
  }
  return safe;
}

export async function createUser(payload) {
  const safePayload = stripSecrets(payload || {});
  const user = { id: `usr_${Date.now()}`, ...safePayload };
  users.push(user);
  return user;
}
