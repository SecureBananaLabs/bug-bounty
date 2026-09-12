 ```diff
--- a/apps/api/src/routes/auth.routes.ts
+++ b/apps/api/src/routes/auth.routes.ts
@@ -1,6 +1,7 @@
 import { Router } from 'express';
 import { register, login, refreshToken, oauthCallback } from '../controllers/auth.controller';
 import { validateRequest } from '../middleware/validation.middleware';
+import { authenticate } from '../middleware/auth.middleware';
 import { z } from 'zod';
 
 const router = Router();
@@ -10,6 +11,7 @@
     email: z.string().email(),
     password: z.string().min(6),
     name: z.string().min(1),
+    role: z.enum(['FREELANCER', 'CLIENT']).optional(),
   }),
 });
 
@@ -20,7 +22,7 @@
   }),
 });
 
-router.post('/register', validateRequest(registerSchema), register);
+router.post('/register', authenticate, validateRequest(registerSchema), register);
 router.post('/login', validateRequest(loginSchema), login);
 router.post('/refresh', refreshToken);
 router.get('/oauth/callback', oauthCallback);
--- a/apps/api/src/controllers/auth.controller.ts
+++ b/apps/api/src/controllers/auth.controller.ts
@@ -5,7 +5,7 @@
 import { generateTokens } from '../utils/jwt';
 
 export const register = async (req: Request, res: Response, next: NextFunction) => {
   try {
-    const { email, password, name } = req.body;
+    const { email, password, name, role } = req.body;
 
     const existingUser = await prisma.user.findUnique({
       where: { email },
@@ -15,11 +15,17 @@
       return res.status(400).json({ message: 'Email already registered' });
     }
 
+    // Prevent self-assignment of admin role during registration
+    const allowedRoles = ['FREELANCER', 'CLIENT'];
+    const assignedRole = role && allowedRoles.includes(role) ? role : 'FREELANCER';
+
     const hashedPassword = await bcrypt.hash(password, 10);
 
     const user = await prisma.user.create({
       data: {
         email,
         password: hashedPassword,
         name,
+        role: assignedRole,
       },
     });
 
@@ -35,6 +41,7 @@
       user: {
         id: user.id,
         email: user.email,
+        role: user.role,
       },
     });
   } catch (error) {
--- a/apps/api/src/middleware/auth.middleware.ts
+++ b/apps/api/src/middleware/auth.middleware.ts
@@ -1,6 +1,7 @@
 import { Request, Response, NextFunction } from 'express';
 import { verifyAccessToken } from '../utils/jwt';
 import { prisma } from '@repo/db';
+import { JwtPayload } from '../utils/jwt';
 
 export interface AuthenticatedRequest extends Request {
   user?: {
@@ -10,7 +11,7 @@
   };
 }
 
-export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
+export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
   try {
     const authHeader = req.headers.authorization;
     
@@ -22,7 +23,7 @@
       return;
     }
 
-    const decoded = verifyAccessToken(token);
+    const decoded = verifyAccessToken(token) as JwtPayload;
     
     if (!decoded) {
       res.status(401).json({ message: 'Invalid token' });
@@ -42,6 +43,11 @@
       return;
     }
 
+    // Prevent non-admin users from assigning roles during registration
+    if (req.path === '/register' && user.role !== 'ADMIN') {
+      // Allow to proceed, but role will be restricted in controller
+    }
+
     req.user = {
       id: user.id,
       email: user.email,
@@ -52,3 +58,29 @@
     res.status(401).json({ message: 'Authentication failed' });
   }
 };
+
+export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
+  try {
+    if (!req.user) {
+      res.status(401).json({ message: 'Authentication required' });
+      return;
+    }
+
+    if (req.user.role !== 'ADMIN') {
+      res.status(403).json({ message: 'Admin access required' });
+      return;
+    }
+
+    next();
+  } catch (error) {
+    res.status(500).json({ message: 'Server error' });
+  }
+};
+
+export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
+  const authHeader = req.headers.authorization;
+  if (!authHeader) {
+    next();
+    return;
+  }
+  authenticate(req, res, next);
+};
--- a/apps/api/src/utils/jwt.ts
+++ b/apps/api/src/utils/jwt.ts
@@ -1,5 +1,12 @@
 import jwt from 'jsonwebtoken';
 
+export interface JwtPayload {
+  userId: string;
+  email: string;
+  role: string;
+  iat?: number;
+  exp?: number;
+}
+
 const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access-secret';
 const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret';
 
@@ -16,7 +23,7 @@
   });
 };
 
-export const verifyAccessToken = (token: string) => {
+export const verifyAccessToken = (token: string): JwtPayload | null => {
   try {
     return jwt.verify(token, ACCESS_TOKEN_SECRET) as any;
   } catch (error) {
--- a/apps/api/src/services/auth.service.ts
+++ b/apps/api/src/services/auth.service.ts
@@ -1,6 +1,7 @@
 import { prisma } from '@repo/db';
 import bcrypt from 'bcryptjs';
 import { generateTokens } from '../utils/jwt';
+import { Role } from '@repo/db';
 
 export interface RegisterInput {
   email: string;
@@ -9,6 +10,12 @@
   role?: string;
 }
 
+export interface RegisterOptions {
+  email: string;
+  password: string;
+  name: string;
+  role?: string;
+}
+
 export interface LoginInput {
   email: string;
   password: string;
@@ -16,7 +23,7 @@
 
 export class AuthService {
   async register(input: RegisterInput) {
-    const { email, password, name, role } = input;
+    const { email, password, name } = input;
 
     const existingUser = await prisma.user.findUnique({
       where: { email },
@@ -28,13 +35,18 @@
 
     const hashedPassword = await bcrypt.hash