const users = [];

function createUser(userData) {
  const { email, fullName } = userData;

  if (!email || !fullName) {
    const error = new Error('Email and fullName are required');
    error.statusCode = 400;
    throw error;
  }

  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    const error = new Error('A user with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  const newUser = {
    id: users.length + 1,
    email,
    fullName,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  return newUser;
}

function getUserById(id) {
  return users.find(user => user.id === id) || null;
}

function getAllUsers() {
  return users;
}

module.exports = { createUser, getUserById, getAllUsers };
