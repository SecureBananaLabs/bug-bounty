import { Router } from "express";
import { createMessage } from "../controllers/messageController";

const messageRouter = Router();

messageRouter.post("/", createMessage);

export default messageRouter;
