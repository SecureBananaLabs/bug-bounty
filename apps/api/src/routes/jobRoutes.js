import { Router } from "express";
import { jobs } from "../../../web/lib/mock.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ data: jobs, total: jobs.length });
});

router.get("/:id", (req, res) => {
  const job = jobs.find((j) => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }
  res.json({ data: job });
});

export default router;
