import { Router } from "express";
import { randomUUID } from "crypto";
export const notificationsRouter = Router();
notificationsRouter.post("/", (req, res) => {
  const payload = { ...req.body, id: randomUUID(), read: false };
  return res.json({ success: true, notification: payload });
});
