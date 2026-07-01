```diff
--- a/apps/api/src/middleware/auth.ts
+++ b/apps/api/src/middleware/auth.ts
@@ -45,6 +45,11 @@
     if (!req.user) {
       return res.status(401).json({ message: 'Unauthorized' });
     }
+    // Prevent self-assignment of admin role
+    if (req.body?.role === 'ADMIN' && req.user.id === req.params?.id) {
+      return res.status(403).json({ message: 'Cannot self-assign admin role' });
+    }
+
     next();
   };
 
@@ -55,6 +60,11 @@
     if (!req.user) {
       return res.status(401).json({ message: 'Unauthorized' });
     }
+    // Prevent self-assignment of admin role
+    if (req.body?.role === 'ADMIN' && req.user.id === req.params?.id) {
+      return res.status(403).json({ message: 'Cannot self-assign admin role' });
+    }
+
     next();
   };
 
--- a/apps/api/src/routes/users.ts
+++ b/apps/api/src/routes/users.ts
@@ -12,7 +12,7 @@
 router.get('/:id', getUserById);
 router.put('/:id', authenticate, updateUser);
 router.delete('/:id', authenticate, requireAdmin, deleteUser);
-router.patch('/:id/role', authenticate, requireAdmin, updateUserRole);
+router.patch('/:id/role', authenticate, updateUserRole);
 
 // Admin routes
 router.get('/', authenticate, requireAdmin, getAllUsers);
@@ -20,4 +20,4 @@
 export default router;
 
 // Import controller
-import { getUserById, updateUser, deleteUser, getAllUsers } from '../controllers/userController';
+import { getUserById, updateUser, deleteUser, getAllUsers, updateUserRole } from '../controllers/userController';
--- a/apps/api/src/controllers/userController.ts
+++ b/apps/api/src/controllers/userController.ts
@@ -1,5 +1,6 @@
 import { Request, Response } from 'express';
 import { prisma } from '@repo/db';
+import { AuthenticatedRequest } from '../middleware/auth';
 
 export const getUserById = async (req: Request, res: Response) => {
   try {
@@ -78,3 +79,37 @@
     res.status(500).json({ message: 'Failed to fetch users' });
   }
 };
+
+export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
+  try {
+    const { id } = req.params;
+    const { role } = req.body;
+    const currentUser = req.user;
+
+    if (!currentUser) {
+      return res.status(401).json({ message: 'Unauthorized' });
+    }
+
+    // Prevent self-assignment of admin role
+    if (id === currentUser.id && role === 'ADMIN') {
+      return res.status(403).json({ message: 'Cannot self-assign admin role' });
+    }
+
+    // Only admins can assign admin role
+    if (role === 'ADMIN' && currentUser.role !== 'ADMIN') {
+      return res.status(403).json({ message: 'Forbidden: Admin role required' });
+    }
+
+    const updatedUser = await prisma.user.update({
+      where: { id },
+      data: { role },
+    });
+
+    res.json(updatedUser);
+  } catch (error) {
+    console.error('Update user role error:', error);
+    res.status(500).json({ message: 'Failed to update user role' });
+  }
+};
--- a/apps/api/src/middleware/auth.ts
+++ b/apps/api/src/middleware/auth.ts
@@ -45,6 +45,11 @@
     if (!req.user) {
       return res.status(401).json({ message: 'Unauthorized' });
     }
+    // Prevent self-assignment of admin role
+    if (req.body?.role === 'ADMIN' && req.user.id === req.params?.id) {
+      return res.status(403).json({ message: 'Cannot self-assign admin role' });
+    }
+
     next();
   };
 
@@ -55,6 +60,11 @@
     if (!req.user) {
       return res.status(401).json({ message: 'Unauthorized' });
     }
+    // Prevent self-assignment of admin role
+    if (req.body?.role === 'ADMIN' && req.user.id === req.params?.id) {
+      return res.status(403).json({ message: 'Cannot self-assign admin role' });
+    }
+
     next();
   };
 
--- a/apps/api/src/routes/users.ts
+++ b/apps/api/src/routes/users.ts
@@ -12,7 +12,7 @@
 router.get('/:id', getUserById);
 router.put('/:id', authenticate, updateUser);
 router.delete('/:id', authenticate, requireAdmin, deleteUser);
-router.patch('/:id/role', authenticate, requireAdmin, updateUserRole);
+router.patch('/:id/role', authenticate, updateUserRole);
 
 // Admin routes
 router.get('/', authenticate, requireAdmin, getAllUsers);
@@ -20,4 +20,4 @@
 export default router;
 
 // Import controller
-import { getUserById, updateUser, deleteUser, getAllUsers } from '../controllers/userController';
+import { getUserById, updateUser, deleteUser, getAllUsers, updateUserRole } from '../controllers/userController';
--- a/apps/api/src/controllers/userController.ts
+++ b/apps/api/src/controllers/userController.ts
@@ -1,5 +1,6 @@
 import { Request, Response } from 'express';
 import { prisma } from '@repo/db';
+import { AuthenticatedRequest } from '../middleware/auth';
 
 export const getUserById = async (req: Request, res: Response) => {
   try {
@@ -78,3 +79,37 @@
     res.status(500).json({ message: 'Failed to fetch users' });
   }
 };
+
+export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
+  try {
+    const { id } = req.params;
+    const { role } = req.body;
+    const currentUser = req.user;
+
+    if (!currentUser) {
+      return res.status(401).json({ message: 'Unauthorized' });
+    }
+
+    // Prevent self-assignment of admin role
+    if (id === currentUser.id && role === 'ADMIN') {
+      return res.status(403).json({ message: 'Cannot self-assign admin role' });
+    }
+
+    // Only admins can assign admin role
+    if (role === 'ADMIN' && currentUser.role !== 'ADMIN') {
+      return res.status(403).json({ message: 'Forbidden: Admin role required' });
+    }
+
+