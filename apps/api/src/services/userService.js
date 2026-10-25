const users = [];

export class DuplicateUserEmailError extends Error {
  constructor(email) {
    super(`User email already exists: ${email}`);
    this.name = "DuplicateUserEmailError";
  }
}

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  if (users.some((user) => user.email === payload.email)) {
    throw new DuplicateUserEmailError(payload.email);
  }

  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
