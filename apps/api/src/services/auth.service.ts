// Placeholder - actual service implementation where role validation would occur
// Example implementation of the fix:
/*
export const sanitizeRoleInput = (userData: any) => {
  // Prevent self-admin role assignment
  if (userData.role && userData.role === 'admin') {
    userData.role = 'user';
  }
  return userData;
};

// In registration function:
// const sanitizedData = sanitizeRoleInput(req.body);
*/