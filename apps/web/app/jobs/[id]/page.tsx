"use client";

import { useEffect, useState } from "react";
import { jobs as mockJobs } from "@/lib/mock";

interface Job {
  id: string;
  title: string;
  budget: string;
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Find job from mock data
    const foundJob = mockJobs.find((j) => j.id === params.id);
    setJob(foundJob || null);
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <section className="card">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </section>
    );
  }

  if (!job) {
    return (
      <section className="card">
        <h2>Job Not Found</h2>
        <p>The job you are looking for does not exist.</p>
        <a href="/jobs" className="btn-primary mt-4">
          Back to Jobs
        </a>
      </section>
    );
  }

  return (
    <section className="card">
      <h1 className="text-3xl font-bold mb-4">{job.title}</h1>
      <p className="text-gray-600 mb-6">Budget: {job.budget}</p>
      
      <div className="flex gap-4">
        <button className="btn-primary">Submit Proposal</button>
        <a href="/jobs" className="btn-outline">
          Back to Jobs
        </a>
      </div>
    </section>
  );
}
