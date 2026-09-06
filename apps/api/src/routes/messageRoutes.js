import { Router } from "express";
import { getMessages, postMessage } from "../controllers/messageController.js";
import { validate } from "../middleware/validate.js";
import { createMessageSchema } from "../validators/message.js";

export const messageRoutes = Router();

messageRoutes.get("/", getMessages);
messageRoutes.post("/", validate(createMessageSchema), postMessage);
