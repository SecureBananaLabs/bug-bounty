// Middleware to prevent self-assignment of admin roles in registration
export const preventAdminSelfAssignment = (req: any, res: any, next: any) => {
  // Remove admin role from request body to prevent self-assignment
  if (req.body && req.body.role) {
    if (req.body.role === 'admin') {
      delete req.body.role;
    }
  }
  next();
};

// Default role assignment middleware
export const roleAssignmentGuard = (req: any, res: any, next: any) => {
  // Ensure no role escalation is possible
  if (req.body.role && req.body.role === 'admin') {
    req.body.role = 'user';  // Force default role
  }
  next();
};

// Role validation service
export const validateRoleAssignment = (role: string): string => {
  return role === 'admin' ? 'user' : role;
};