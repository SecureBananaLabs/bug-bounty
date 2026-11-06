import { Router } from "express";
import { getMessages, postMessage } from "../controllers/messageController.js";
import { methodNotAllowed } from "../middleware/methodNotAllowed.js";

export const messageRoutes = Router();

messageRoutes.route("/")
  .get(getMessages)
  .post(postMessage)
  .all(methodNotAllowed(["GET", "POST"]));
