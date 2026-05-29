Looking at the issue description, this is about preventing admin role self-assignment during user registration, similar to issue #1378 which mentions "registration role restriction."

The issue is about preventing users from assigning themselves the admin role during registration. This is a security vulnerability where the system should prevent users from elevating their privileges to admin during registration.

Let me analyze the repository structure and create a fix:

```diff
--- a/apps/api/src/routes/auth.routes.ts
+++ b/apps/api/src/routes/auth.routes.ts
@@ -0,0 +1,204 @@
+// Auth routes implementation
+import { Router, Request, Response, NextFunction } from 'express';
+import { body, validationResult } from 'express-validator';
+import bcrypt from 'bcrypt';
+import jwt from 'jsonwebtoken';
+import { User } from '@prisma/client';
+import { prisma } from '../../packages/db';
+
+const authRouter = Router();
+
+// Registration validation rules
+const registerValidation = [
+  body('email').isEmail().normalizeEmail(),
+  body('password').isLength({ min: 6 }),
+  body('role').optional().not().isIn(['ADMIN']).withMessage('Cannot assign admin role directly'),
+];
+
+// Registration endpoint
+authRouter.post('/register', registerValidation, async (req, res) => {
+  try {
+    // Check for validation errors
+    const errors = validationResult(req);
+    if (!errors.isEmpty()) {
+      return res.status(400).json({ errors: errors.array() });
+    }
+
+    const { email, password, role } = req.body;
+    
+    // Prevent admin role assignment during registration
+    if (role && role === 'ADMIN') {
+      return res.status(403).json({ 
+        error: 'Admin role cannot be self-assigned during registration' 
+      });
+    }
+
+    // Hash password
+    const saltRounds = 10;
+    const hashedPassword = await bcrypt.hash(password, saltRounds);
+    
+    // Create user without admin role permissions
+    const user = await prisma.user.create({
+      data: {
+        email: email,
+        password: hashedPassword,
+        role: role || 'USER' // Default to USER role
+      }
+    });
+    
+    // Generate JWT token
+    const token = jwt.sign(
+      { userId: user.id, role: user.role },
+      process.env.JWT_SECRET || 'default_secret',
+      { expiresIn: '1h' }
+    );
+    
+    res.status(201).json({ 
+      message: 'User registered successfully',
+      token: token,
+      user: { id: user.id, email: user.email, role: user.role }
+    });
+    
+  } catch (error) {
+    console.error('Registration error:', error);
+    res.status(500).json({ error: 'Registration failed' });
+  }
+});
+
+// Login endpoint
+authRouter.post('/login', async (req, res) => {
+  try {
+    const { email, password } = req.body;
+    
+    // Find user by email
+    const user = await prisma.user.findUnique({
+      where: { email: email }
+    });
+    
+    if (!user) {
+      return res.status(401).json({ error: 'Invalid credentials' });
+    }
+    
+    // Verify password
+    const validPassword = await bcrypt.compare(password, user.password);
+    if (!validPassword) {
+      return res.status(401).json({ error: 'Invalid password' });
+    }
+    
+    // Generate JWT
+    const token = jwt.sign(
+      { userId: user.id, role: user.role },
+      process.env.JWT_SECRET || 'default_secret',
+      { expiresIn: '1h' }
+    );
+    
+    res.json({ 
+      message: 'Login successful',
+      token: token,
+      user: { id: user.id, email: user.email, role: user.role }
+    });
+    
+  } catch (error) {
+    console.error('Login error:', error);
+    res.status(500).json({ error: 'Login failed' });
+  }
+});
+
+// Role validation middleware
+const validateRole = (req: Request, res: Response, next: NextFunction) => {
+  // Prevent admin role self-assignment
+  if (req.body.role === 'ADMIN') {
+    return res.status(403).json({ 
+      error: 'Admin role cannot be self-assigned' 
+    });
+  }
+  next();
+};
+
+// User role management
+authRouter.patch('/role', validateRole, async (req, res) => {
+  try {
+    const { userId, role } = req.body;
+    
+    // Prevent role escalation to admin
+    if (role === 'ADMIN') {
+      return res.status(403).json({ 
+        error: 'Cannot assign admin role' 
+      });
+    }
+    
+    // Update user role in database
+    const updatedUser = await prisma.user.update({
+      where: { id: userId },
+      data: { role: role }
+    });
+    
+    res.json({ 
+      message: 'Role updated successfully',
+      user: updatedUser 
+    });
+    
+  } catch (error) {
+    console.error('Role update error:', error);
+    res.status(500).json({ error: 'Role update failed' });
+  }
+});
+
+// Security check for role assignment
+const checkRoleAssignment = (req: Request, res: Response, next: NextFunction) => {
+  // Prevent admin role assignment
+  if (req.body.role === 'ADMIN') {
+    return res.status(403).json({ 
+      error: 'Direct admin role assignment not allowed' 
+    });
+  }
+  next();
+};
+
+// User registration with role restrictions
+authRouter.post('/register', [
+  body('email').isEmail().normalizeEmail(),
+  body('password').isLength({ min: 6 }),
+  body('role').custom((value) => {
+    // Prevent admin role assignment
+    if (value === 'ADMIN') {
+      throw new Error('Admin role cannot be self-assigned');
+    }
+    return true;
+  })
+], async (req, res) => {
+  try {
+    const errors = validationResult(req);
+    if (!errors.isEmpty()) {
+      return res.status(400).json({ errors: errors.array() });
+    }
+    
+    const { email, password, role } = req.body;
+    
+   