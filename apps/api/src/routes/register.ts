import { Router } from "express";
export const registerRouter = Router();
registerRouter.post("/", (req, res) => {
  const payload = { ...req.body };
  delete payload.role; // Prevent privilege escalation
  // Create user logic
  return res.json({ success: true, user: payload });
});
