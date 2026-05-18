# apps/api/src/middleware/auth.js
+ import { verifyAccessToken, verifyAdminRole } from "../utils/jwt.js";
 
-export function authMiddleware(req, res, next) {
+ export function authMiddleware(req, res, next) {
+   const authHeader = req.headers.authorization;
+   if (!authHeader?.startsWith("Bearer ")) {
+     return fail(res, "Unauthorized", 401);
+   }
 
+   try {
+     req.user = verifyAccessToken(authHeader.slice(7));
+     if (!verifyAdminRole(req.user)) {
+       return fail(res, "Forbidden", 403);
+     }
+     return next();
+   } catch {
+     return fail(res, "Invalid token", 401);
+   }
+ }
 
 
 # apps/api/src/utils/jwt.js
+ export function verifyAdminRole(user) {
+   return user.role === "admin";
+ }
 
 
 # apps/api/src/routes/adminRoutes.js
+ import express from "express";
+ import { authMiddleware } from "../middleware/auth.js";
+ import { adminController } from "../controllers/adminController.js";
 
+ const adminRouter = express.Router();
 
+ adminRouter.use(authMiddleware);
 
+ adminRouter.get("/", adminController.getAdminPanel);
+ adminRouter.get("/users", adminController.getUsers);
+ adminRouter.get("/jobs", adminController.getJobs);
+ adminRouter.get("/disputes", adminController.getDisputes);
+ adminRouter.get("/metrics", adminController.getMetrics);
 
+ export { adminRouter };
 
 
 # apps/api/src/controllers/adminController.js
+ import { Request, Response } from "express";
+ import { prisma } from "../config/db.js";
 
+ export async function getAdminPanel(req: Request, res: Response) {
+   const users = await prisma.user.findMany();
+   const jobs = await prisma.job.findMany();
+   const disputes = await prisma.dispute.findMany();
+   const metrics = await prisma.metric.findMany();
 
+   res.json({ users, jobs, disputes, metrics });
+ }
 
+ export async function getUsers(req: Request, res: Response) {
+   const users = await prisma.user.findMany();
+   res.json(users);
+ }
 
+ export async function getJobs(req: Request, res: Response) {
+   const jobs = await prisma.job.findMany();
+   res.json(jobs);
+ }
 
+ export async function getDisputes(req: Request, res: Response) {
+   const disputes = await prisma.dispute.findMany();
+   res.json(disputes);
+ }
 
+ export async function getMetrics(req: Request, res: Response) {
+   const metrics = await prisma.metric.findMany();
+   res.json(metrics);
+ }
 
 
 # packages/db/src/index.ts
+ import { PrismaClient } from "@prisma/client";
 
+ const prisma = new PrismaClient();
 
+ export { prisma };
 
 
 # apps/api/src/app.js
+ import { adminRouter } from "./routes/adminRoutes.js";
 
+ const app = express();
 
+ app.use("/admin", adminRouter);
 
+ export { app };
