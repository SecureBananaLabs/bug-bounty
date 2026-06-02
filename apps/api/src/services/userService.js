const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  // Explicitly exclude any password field from the stored user record.
  // Passwords must be hashed by authService before reaching this layer;
  // this guard prevents accidental plaintext storage if the call site
  // changes and forgets to hash first.
  const { password, passwordHash: _unused, ...safePayload } = payload;
  if (password !== undefined) {
    throw new Error(
      "createUser received a plain-text password. Hash it in authService before calling createUser."
    );
  }
  const user = { ...safePayload, id: `usr_${Date.now()}` };
  users.push(user);
  return user;
}
