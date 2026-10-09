import { v4 as uuidv4 } from 'uuid';

// In-memory storage for users
const users: Record<string, any> = {};

// Initialize with some default users
users['1'] = { id: '1', username: 'admin', email: 'admin@bountyhive.com', roles: ['admin'], status: 'active', createdAt: new Date('2024-01-15') };
users['2'] = { id: '2', username: 'dev_sarah', email: 'sarah@bountyhive.com', roles: ['submitter'], status: 'active', createdAt: new Date('2024-02-20') };
users['3'] = { id: '3', username: 'reviewer_mike', email: 'mike@bountyhive.com', roles: ['reviewer'], status: 'active', createdAt: new Date('2024-03-10') };
users['4'] = { id: '4', username: 'dev_alex', email: 'alex@bountyhive.com', roles: ['submitter'], status: 'inactive', createdAt: new Date('2024-04-05') };
users['5'] = { id: '5', username: 'analyst_jen', email: 'jen@bountyhive.com', roles: ['analyst'], status: 'active', createdAt: new Date('2024-05-12') };

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  role: string;
}

export function createUser(input: CreateUserInput) {
  const id = uuidv4();
  
  // Strip any caller-provided id field and use only server-generated ID
  const { id: _ignoredId, ...payload } = input;
  
  const user = { 
    id,
    ...payload,
    roles: [input.role],
    status: 'active',
    createdAt: new Date()
  };
  
  users[id] = user;
  return user;
}

export function getUserById(id: string) {
  return users[id];
}

export function updateUser(id: string, updates: Partial<typeof users[string]>) {
  if (!users[id]) {
    return null;
  }
  
  users[id] = { ...users[id], ...updates };
  return users[id];
}

export function deleteUser(id: string) {
  if (!users[id]) {
    return false;
  }
  
  delete users[id];
  return true;
}

export function updateRole(userId: string, role: string) {
  const user = users[userId];
  if (!user) {
    return null;
  }
  
  user.roles = [role];
  users[userId] = user;
  return user;
}

export function deleteRole(userId: string) {
  const user = users[userId];
  if (!user) {
    return false;
  }
  
  delete users[userId];
  return true;
}

export function addUserToRole(userId: string, role: string) {
  const user = users[userId];
  if (!user) {
    return null;
  }
  
  if (!user.roles.includes(role)) {
    user.roles.push(role);
    users[userId] = user;
  }
  
  return user;
}

export function removeUserFromRole(userId: string, role: string) {
  const user = users[userId];
  if (!user) {
    return null;
  }
  
  const roleIndex = user.roles.indexOf(role);
  if (roleIndex === -1) {
    return null;
  }
  
  user.roles.splice(roleIndex, 1);
  users[userId] = user;
  return user;
}
