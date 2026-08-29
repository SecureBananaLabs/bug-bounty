import { listJobs, createJob } from "../services/jobService.js";

export async function getJobs(req, res) {
  try {
    const jobs = await listJobs();
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
}

export async function postJob(req, res) {
  try {
    const job = await createJob(req.body);
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: "Failed to create job" });
  }
}
