diff --git a/packages/db/src/index.ts b/packages/db/src/index.ts
index 4c7c0e2..8c5b4c6 100644
--- a/packages/db/src/index.ts
+++ b/packages/db/src/index.ts
@@ -1 +1,4 @@
 export * from "@prisma/client";
+
+import { PrismaClient } from '@prisma/client';
+const prisma = new PrismaClient();
+export { prisma };

diff --git a/apps/api/src/services/authService.ts b/apps/api/src/services/authService.ts
index 4c7c0e2..8c5b4c6 100644
--- a/apps/api/src/services/authService.ts
+++ b/apps/api/src/services/authService.ts
@@ -1,6 +1,14 @@
 import { signAccessToken } from "../utils/jwt.js";
+
+import { prisma } from "../db";
+
 export async function registerUser(payload) {
-  // TODO: persist new user via Prisma
+  const user = await prisma.user.create({
+    data: {
+      email: payload.email,
+      role: payload.role,
+    },
+  });
+  return {
+    id: user.id,
+    email: user.email,
+    role: user.role,
+    token: signAccessToken({ sub: user.id, role: user.role })
+  };
 }
+
 export async function loginUser(payload) {
-  // TODO: verify password hash against stored user record
+  const user = await prisma.user.findFirst({
+    where: {
+      email: payload.email,
+    },
+  });
+  if (!user || user.password !== payload.password) {
+    throw new Error('Invalid credentials');
+  }
+  return {
+    email: user.email,
+    token: signAccessToken({ sub: user.id, role: user.role })
+  };
 }

diff --git a/apps/api/src/middleware/auth.js b/apps/api/src/middleware/auth.js
index 4c7c0e2..8c5b4c6 100644
--- a/apps/api/src/middleware/auth.js
+++ b/apps/api/src/middleware/auth.js
@@ -1,10 +1,17 @@
 import { fail } from "../utils/response.js";
 import { verifyAccessToken } from "../utils/jwt.js";
+
+import { prisma } from "../db";
+
 export function authMiddleware(req, res, next) {
   const authHeader = req.headers.authorization;
   if (!authHeader?.startsWith("Bearer ")) {
     return fail(res, "Unauthorized", 401);
   }
+
+  try {
+    const token = verifyAccessToken(authHeader.slice(7));
+    const user = await prisma.user.findFirst({
+      where: {
+        id: token.sub,
+      },
+    });
+    if (!user) {
+      throw new Error('Invalid token');
+    }
+    req.user = user;
+    return next();
+  } catch {
+    return fail(res, "Invalid token", 401);
+  }
 }

diff --git a/apps/api/src/routes/adminRoutes.ts b/apps/api/src/routes/adminRoutes.ts
new file mode 100644
index 0000000..8c5b4c6
--- /dev/null
+++ b/apps/api/src/routes/adminRoutes.ts
@@ -0,0 +1,57 @@
+import express, { Router } from 'express';
+import { authMiddleware } from '../middleware/auth';
+import { prisma } from '../db';
+
+const adminRouter: Router = express.Router();
+
+adminRouter.use(authMiddleware);
+
+adminRouter.get('/users', async (req, res) => {
+  const users = await prisma.user.findMany();
+  res.json(users);
+});
+
+adminRouter.get('/jobs', async (req, res) => {
+  const jobs = await prisma.job.findMany();
+  res.json(jobs);
+});
+
+adminRouter.get('/disputes', async (req, res) => {
+  const disputes = await prisma.dispute.findMany();
+  res.json(disputes);
+});
+
+adminRouter.post('/suspend-user', async (req, res) => {
+  const { userId } = req.body;
+  await prisma.user.update({
+    where: {
+      id: userId,
+    },
+    data: {
+      suspended: true,
+    },
+  });
+  res.json({ message: 'User suspended' });
+});
+
+adminRouter.post('/resolve-dispute', async (req, res) => {
+  const { disputeId, resolution } = req.body;
+  await prisma.dispute.update({
+    where: {
+      id: disputeId,
+    },
+    data: {
+      resolution,
+    },
+  });
+  res.json({ message: 'Dispute resolved' });
+});
+
+export { adminRouter };

diff --git a/apps/web/pages/AdminPanelPage.tsx b/apps/web/pages/AdminPanelPage.tsx
new file mode 100644
index 0000000..8c5b4c6
--- /dev/null
+++ b/apps/web/pages/AdminPanelPage.tsx
@@ -0,0 +1,100 @@
+import React, { useState, useEffect } from 'react';
+import axios from 'axios';
+
+const AdminPanelPage = () => {
+  const [users, setUsers] = useState([]);
+  const [jobs, setJobs] = useState([]);
+  const [disputes, setDisputes] = useState([]);
+
+  useEffect(() => {
+    const fetchUsers = async () => {
+      const response = await axios.get('/api/admin/users');
+      setUsers(response.data);
+    };
+    fetchUsers();
+  }, []);
+
+  useEffect(() => {
+    const fetchJobs = async () => {
+      const response = await axios.get('/api/admin/jobs');
+      setJobs(response.data);
+    };
+    fetchJobs();
+  }, []);
+
+  useEffect(() => {
+    const fetchDisputes = async () => {
+      const response = await axios.get('/api/admin/disputes');
+      setDisputes(response.data);
+    };
+    fetchDisputes();
+  }, []);
+
+  const handleSuspendUser = async (userId) => {
+    await axios.post('/api/admin/suspend-user', { userId });
+  };
+
+  const handleResolveDispute = async (disputeId, resolution) => {
+    await axios.post('/api/admin/resolve-dispute', { disputeId, resolution });
+  };
+
+  return (
+    <div>
+      <h1>Admin Panel</h1>
+      <h2>Users</h2>
+      <ul>
+        {users.map((user) => (
+          <li key={user.id}>
+            {user.email}
+            <button onClick={() => handleSuspendUser(user.id)}>Suspend</button>
+          </li>
+        ))}
+      </ul>
+      <h2>Jobs</h2>
+      <ul>
+        {jobs.map((job) => (
+          <li key={job.id}>
+            {job.title}
+          </li>
+        ))}
+      </ul>
+      <h2>Disputes</h2>
+      <ul>
+        {disputes.map((dispute) => (
+          <li key={dispute.id}>
+            {dispute.description}
+            <button onClick={() => handleResolveDispute(dispute.id, 'resolved')}>Resolve</button>
+          </li>
+        ))}
+      </ul>
+    </div>
+  );
+};
+
+export default AdminPanelPage;

diff --git a/packages/db/src/schema.prisma b/packages/db/src/schema.prisma
index 4c7c0e2..8c5b4c6 100644
--- a/packages/db/src/schema.prisma
+++ b/packages/db/src/schema.prisma
@@ -1,4 +1,20 @@
 model User {
+  id       String   @id @default(cuid())
+  email    String   @unique
+  role     String
+  suspended Boolean @default(false)
+  password String
+  jobs     Job[]
+  disputes Dispute[]
 }
+
+model Job {
+  id       String   @id @default(cuid())
+  title    String
+  description String
+  userId   String
+  user     User     @relation(fields: [userId], references: [id])
+}
+
+model Dispute {
+  id       String   @id @default(cuid())
+  description String
+  userId   String
+  user     User     @relation(fields: [userId], references: [id])
+  resolution String
+}
