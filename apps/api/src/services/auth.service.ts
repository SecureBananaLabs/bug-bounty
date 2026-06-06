import { prisma } from '@packages/db';

export const registerUser = async (userData: any) => {
  // Remove any attempt to assign admin role
  if (userData.roles && Array.isArray(userData.roles)) {
    const sanitizedRoles = userData.roles.filter((role: string) => 
      role.toLowerCase() !== 'admin'
    );
    
    // Ensure all new users get the default user role
    if (!sanitizedRoles.includes('user')) {
      sanitizedRoles.push('user');
    }
    
    userData.roles = sanitizedRoles;
  } else {
    userData.roles = ['user'];
  }

  // Actual user creation logic would go here
  // This is a simplified representation
  return userData;
};