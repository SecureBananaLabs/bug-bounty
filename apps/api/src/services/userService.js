import { createUser } from '../db/user';

const registerUser = async (userData) => {
  // Validate that userData includes fullName
  if (!userData.fullName || userData.fullName.trim() === '') {
    throw new Error('Full name is required');
  }
  
  const user = await createUser({
    ...userData,
    fullName: userData.fullName
  });
  return user;
};

export { registerUser };
const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { id: `usr_${Date.now()}`, ...payload };
  users.push(user);
  return user;
}
