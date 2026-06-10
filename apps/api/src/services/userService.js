import { registerUser } from '../db/user';

export const createUser = async (userData) => {
  // The service should now include fullName in the user data
  const user = await registerUser({
    ...userData,
    fullName: userData.fullName
  });
  return user;
};
export { createUser };
const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
