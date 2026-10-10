function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

const users = [];

export async function listUsers() {
  return [...users];
}

export async function createUser(payload) {
  const email = normalizeEmail(payload.email);
  const existing = users.find((user) => normalizeEmail(user.email) === email);
  if (existing) {
    const error = new Error("Email already registered");
    error.name = "ConflictError";
    throw error;
  }

  const { name } = payload;
  const user = {
    id: `usr_${Date.now()}`,
    email,
    name,
    role: "client",
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}

export async function getUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  return users.find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
}
