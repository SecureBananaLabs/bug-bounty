import { Router } from 'express';
import { register } from '../controllers/auth.controller';
import { validateRegistration } from '../middleware/validation';

const router = Router();

// Prevent admin role assignment during registration
router.post('/register', validateRegistration, (req, res, next) => {
  // Ensure no admin roles can be self-assigned
  if (req.body.role === 'admin') {
    return res.status(400).json({
      error: 'Admin role cannot be self-assigned during registration'
    });
  }
  
  // Sanitize roles from request body to prevent privilege escalation
  if (req.body.roles && Array.isArray(req.body.roles)) {
    req.body.roles = req.body.roles.filter((role: string) => role !== 'admin');
  }
  next();
}, register);