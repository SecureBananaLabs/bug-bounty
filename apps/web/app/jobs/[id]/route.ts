import { z } from "zod";
import { jobs } from "@/lib/mock";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const job = jobs.find((j) => j.id === params.id);
  if (!job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }
  return Response.json(job);
}