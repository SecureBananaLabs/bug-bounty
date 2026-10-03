import { Router } from "express";
import { getMessages, postMessage } from "../controllers/messageController.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const schema = z.object({ content: z.string().min(1), recipientId: z.string().min(1), jobId: z.string().optional() }).strict();

export const messageRoutes = Router();

messageRoutes.get("/", getMessages);
messageRoutes.post("/", validate(schema), postMessage);
