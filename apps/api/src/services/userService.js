const users = [];

export class DuplicateUserEmailError extends Error {
  constructor() {
    super("User email already exists");
    this.name = "DuplicateUserEmailError";
  }
}

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  if (users.some((user) => user.email === payload?.email)) {
    throw new DuplicateUserEmailError();
  }

  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
