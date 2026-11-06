const users = [];

function redact(user) {
  const { password, ...safe } = user;
  return safe;
}

export async function listUsers() {
  return users.map(redact);
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return redact(user);
}
