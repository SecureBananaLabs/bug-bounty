import { validateSchema } from "../middleware/validationMiddleware.js";
import { MessageSchema } from "../schemas/validationSchemas.js";
import { Router } from "express";
import { getMessages, postMessage } from "../controllers/messageController.js";

export const messageRoutes = Router();

messageRoutes.get("/", getMessages);
messageRoutes.post("/", postMessage);
