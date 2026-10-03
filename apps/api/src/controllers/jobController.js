<content>
import { prisma } from "../lib/prisma.js";
import { updateJobSchema } from "../validators/job.js";

export const getJobs = async (req, res) => {
  try {
    const jobs = await prisma.job.findMany();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
};

export const postJob = async (req, res) => {
  try {
    const validatedData = req.body; // Assuming validation middleware is used
    const newJob = await prisma.job.create({
      data: validatedData,
    });
    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ error: "Failed to create job" });
  }
};

export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateJobSchema.parse(req.body);
    const updatedJob = await prisma.job.update({
      where: { id: id },
      data: validatedData,
    });
    res.json(updatedJob);
  } catch (error) {
    if (error.name === "ZodError") {
      res.status(400).json({ error: "Invalid input data", details: error.errors });
    } else if (error.code === "P2025") {
      res.status(404).json({ error: "Job not found" });
    } else {
      res.status(500).json({ error: "Failed to update job" });
    }
  }
};