const users = [
  // Include a default admin user for testing
  { id: 'usr_admin', email: 'admin@freelanceflow.com', role: 'admin', status: 'active' }
];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const user = { 
    id: `usr_${Date.now()}`, 
    status: 'active',
    ...payload 
  };
  users.push(user);
  return user;
}

export async function updateUserStatus(userId, status) {
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('User not found');
  user.status = status;
  return user;
}

