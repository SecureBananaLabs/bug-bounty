// Placeholder - actual file content would be analyzed and modified
// This would typically contain the registration route logic
// Example fix implementation:
/*
export const register = async (req: Request, res: Response) => {
  try {
    // Remove admin role from request body to prevent self-assignment
    if (req.body.role === 'admin') {
      delete req.body.role;
    }
    
    // Continue with registration logic...
    // [Implementation would sanitize the role assignment]
  }
};
*/