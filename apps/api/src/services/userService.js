const users = [];

function sanitize(user) {
  const { password, ...safe } = user;
  return safe;
}

export async function listUsers() {
  return users.map(sanitize);
}

export async function createUser(payload) {
  const { password, ...meta } = payload;
  const user = { id: `usr_${Date.now()}`, password, ...meta };
  users.push(user);
  return sanitize(user);
}
