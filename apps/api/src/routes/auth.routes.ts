import express from 'express';
import { preventRoleElevation } from '../middleware/roleValidation.middleware';

const router = express.Router();

// Apply middleware to prevent role elevation
router.post('/register', preventRoleElevation, (req, res) => {
  // Registration logic here would go through the role validation middleware
  // which removes any admin roles from the request body
  // Actual implementation would depend on the existing codebase structure
});

router.post('/register/admin', (req, res) => {
  // This would be an admin-only endpoint for creating admin users
  // Regular user registration cannot assign admin roles due to the middleware
});

export default router;