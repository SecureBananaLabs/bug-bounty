import { Router } from "express";
export const jobsCreateRouter = Router();
jobsCreateRouter.post("/", (req, res) => {
  const payload = { ...req.body };
  delete payload.id;
  delete payload.status; // Prevent overriding open status
  return res.json({ success: true, job: payload });
});
