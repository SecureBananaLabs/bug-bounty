const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid payload: payload must be an object");
  }

  const { name, email } = payload;

  if (!name || typeof name !== "string" || !name.trim()) {
    throw new Error("Invalid payload: 'name' is required");
  }

  if (!email || typeof email !== "string" || !email.trim()) {
    throw new Error("Invalid payload: 'email' is required");
  }

  const user = {
    id: `usr_${Date.now()}`,
    name: name.trim(),
    email: email.trim()
  };

  users.push(user);
  return user;
}
