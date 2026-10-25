import { Router } from "express";
import { getMessages, postMessage } from "../controllers/messageController.js";
import { authMiddleware } from "../middleware/auth.js";

export const messageRoutes = Router();

messageRoutes.use(authMiddleware);
messageRoutes.get("/", getMessages);
messageRoutes.post("/", postMessage);mport { Router } from "express";
import { getMessages, postMessage } from "../controllers/messageController.js";

export const messageRoutes = Router();

messageRoutes.get("/", getMessages);
messageRoutes.post("/", postMessage);
