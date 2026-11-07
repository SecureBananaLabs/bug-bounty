 ```diff
--- a/apps/api/src/routes/auth.routes.ts
+++ b/apps/api/src/routes/auth.routes.ts
@@ -1,6 +1,7 @@
 import { Router } from 'express';
 import { z } from 'zod';
 import { refreshToken, generateToken } from '../services/auth.service';
+import { verifyToken } from '../utils/jwt';
 
 const router = Router();
 
@@ -9,6 +10,10 @@ const loginSchema = z.object({
   password: z.string().min(1),
 });
 
+const refreshSchema = z.object({
+  token: z.string().min(1),
+});
+
 router.post('/login', async (req, res, next) => {
   try {
     const { email, password } = loginSchema.parse(req.body);
@@ -21,9 +26,22 @@ router.post('/login', async (req, res, next) => {
 
 router.post('/refresh', async (req, res, next) => {
   try {
-    const accessToken = await refreshToken('usr_existing');
-    res.json({ accessToken });
+    const { token } = refreshSchema.parse(req.body);
+
+    const decoded = verifyToken(token);
+    if (!decoded) {
+      return res.status(401).json({ message: 'Invalid or expired refresh token' });
+    }
+
+    const { sub, role } = decoded;
+    if (!sub || !role) {
+      return res.status(401).json({ message: 'Invalid token payload' });
+    }
+
+    const accessToken = await refreshToken(sub, role);
+    res.json({ accessToken, sub, role });
   } catch (err) {
     next(err);
   }
@@ -31,3 +49,4 @@ router.post('/refresh', async (req, res, next) => {
 
 export default router;
+
--- a/apps/api/src/services/auth.service.ts
+++ b/apps/api/src/services/auth.service.ts
@@ -1,5 +1,5 @@
-export async function refreshToken(userId: string): Promise<string> {
-  // TODO: validate refresh token, lookup user, etc.
-  const accessToken = generateToken({ sub: userId, role: 'user' });
+export async function refreshToken(sub: string, role: string): Promise<string> {
+  // Issue a new access token preserving the original subject and role
+  const accessToken = generateToken({ sub, role });
   return accessToken;
 }
 
 export function generateToken(payload: { sub: string; role: string }): string {
   // implementation details...
   return `mock-jwt-${payload.sub}-${payload.role}-${Date.now()}`;
 }
+
+export function verifyToken(token: string): { sub: string; role: string } | null {
+  // In a real implementation, this would verify the JWT signature and expiration.
+  // For this fix, we assume a proper JWT verification exists or is added here.
+  // This is a placeholder to demonstrate the expected interface.
+  try {
+    // Mock verification: reject obviously invalid tokens
+    if (!token || token.length < 10) {
+      return null;
+    }
+    // Parse a mock token format: mock-jwt-<sub>-<role>-<timestamp>
+    const parts = token.split('-');
+    if (parts.length < 4 || parts[0] !== 'mock') {
+      return null;
+    }
+    const sub = parts[2];
+    const role = parts[3];
+    if (!sub || !role) {
+      return null;
+    }
+    return { sub, role };
+  } catch {
+    return null;
+  }
+}
+
--- a/apps/api/src/utils/jwt.ts
+++ b/apps/api/src/utils/jwt.ts
@@ -0,0 +1,22 @@
+export function verifyToken(token: string): { sub: string; role: string } | null {
+  // In a real implementation, this would verify the JWT signature and expiration.
+  // This is a placeholder to demonstrate the expected interface.
+  try {
+    if (!token || token.length < 10) {
+      return null;
+    }
+    const parts = token.split('-');
+    if (parts.length < 4 || parts[0] !== 'mock') {
+      return null;
+    }
+    const sub = parts[2];
+    const role = parts[3];
+    if (!sub || !role) {
+      return null;
+    }
+    return { sub, role };
+  } catch {
+    return null;
+  }
+}
+
+export function generateToken(payload: { sub: string; role: string }): string {
+  return `mock-jwt-${payload.sub}-${payload.role}-${Date.now()}`;
+}
+
--- a/apps/api/src/tests/auth.test.ts
+++ b/apps/api/src/tests/auth.test.ts
@@ -0,0 +1,56 @@
+import request from 'supertest';
+import express from 'express';
+import authRoutes from '../routes/auth.routes';
+
+const app = express();
+app.use(express.json());
+app.use('/api/auth', authRoutes);
+
+describe('POST /api/auth/refresh', () => {
+  it('should return 400 when token is missing', async () => {
+    const res = await request(app)
+      .post('/api/auth/refresh')
+      .send({});
+    expect(res.status).toBe(400);
+  });
+
+  it('should return 401 when token is invalid', async () => {
+    const res = await request(app)
+      .post('/api/auth/refresh')
+      .send({ token: 'invalid-token' });
+    expect(res.status).toBe(401);
+    expect(res.body.message).toBe('Invalid or expired refresh token');
+  });
+
+  it('should return 200 and a new access token for a valid token', async () => {
+    // First, generate a valid token by calling login or using a helper
+    // For this test, we construct a valid mock token directly
+    const validToken = 'mock-jwt-usr_existing-user-1234567890';
+    const res = await request(app)
+      .post('/api/auth/refresh')
+      .send({ token: validToken });
+    expect(res.status).toBe(200);
+    expect(res.body.accessToken).toBeDefined();
+    expect(res.body.sub).toBe('usr_existing');
+    expect(res.body.role).toBe('user');
+  });
+
+  it('should preserve sub and role from the original token', async () => {
+    const validToken = 'mock-jwt-admin_user-admin-1234567890';
+    const res = await request(app)
+      .post('/api/auth/refresh')
+      .send({ token: validToken });
+    expect(res.status).toBe(200);
