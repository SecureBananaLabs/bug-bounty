import { Router } from "express";
import { getMessages, postMessage } from "../controllers/messageController.js";
import { authMiddleware } from "../middleware/auth.js";

export const messageRoutes = Router();

// Threads belong to the account that reads them, so both handlers need the
// verified bearer identity instead of answering every anonymous caller.
messageRoutes.use(authMiddleware);
messageRoutes.get("/", getMessages);
messageRoutes.post("/", postMessage);
