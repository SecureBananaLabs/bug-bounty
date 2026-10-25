const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  // Build the record field by field instead of spreading the payload: the
  // spread is what allowed mass assignment to inject `role`, `passwordHash`
  // or any other field the service owns.
  const user = {
    id: `usr_${Date.now()}_${users.length}`,
    email: payload.email,
    fullName: payload.fullName,
    role: payload.role ?? "client",
    bio: payload.bio,
    passwordHash: payload.passwordHash
  };
  users.push(user);
  return user;
}

export async function findUserByEmail(email) {
  if (typeof email !== "string") return null;
  const needle = email.toLowerCase();
  return users.find((user) => user.email?.toLowerCase() === needle) ?? null;
}
