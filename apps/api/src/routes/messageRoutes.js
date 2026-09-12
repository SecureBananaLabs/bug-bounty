import { Router } from "express";
import { getMessages, postMessage } from "../controllers/messageController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const messageRoutes = Router();

messageRoutes.get("/", getMessages);
messageRoutes.post("/", postMessage);
messageRoutes.all("/", methodNotAllowed(["GET", "POST"]));
