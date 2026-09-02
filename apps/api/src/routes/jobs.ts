import { Router } from "express";
import { updateJobSchema } from "@packages/db/schemas";
export const jobsRouter = Router();
jobsRouter.patch("/:id", (req, res) => {
  const result = updateJobSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error });
  // Update logic here
  return res.json({ success: true, updated: req.params.id });
});
