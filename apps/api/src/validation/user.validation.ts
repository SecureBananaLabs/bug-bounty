import { z } from 'zod';

// Schema for user registration input validation
export const userRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  roles: z.array(z.string()).optional().transform(roles => {
    // Remove any admin roles to prevent self-assignment
    if (!roles) return ['USER'];
    const filteredRoles = roles.filter(role => 
      role.toLowerCase() !== 'admin' && role.toLowerCase() !== 'administrator'
    );
    if (filteredRoles.length === 0) {
      return ['USER'];
    }
    return filteredRoles;
  }),
  name: z.string().optional(),
});