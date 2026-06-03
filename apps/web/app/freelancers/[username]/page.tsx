"use client";

import { useEffect, useState } from "react";
import { freelancers as mockFreelancers } from "@/lib/mock";

interface Freelancer {
  username: string;
  skills: string[];
  rate: string;
}

export default function FreelancerProfilePage({ params }: { params: { username: string } }) {
  const [freelancer, setFreelancer] = useState<Freelancer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const found = mockFreelancers.find((f) => f.username === params.username);
    setFreelancer(found || null);
    setLoading(false);
  }, [params.username]);

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

  if (!freelancer) {
    return (
      <section className="card">
        <h2>Freelancer Not Found</h2>
        <p>The freelancer @{params.username} does not exist.</p>
        <a href="/freelancers" className="btn-primary mt-4">
          Browse Freelancers
        </a>
      </section>
    );
  }

  return (
    <section className="card">
      <h1 className="text-3xl font-bold mb-2">@{freelancer.username}</h1>
      <p className="text-gray-600 mb-4">Rate: {freelancer.rate}</p>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Skills</h2>
        <div className="flex flex-wrap gap-2">
          {freelancer.skills.map((skill) => (
            <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button className="btn-primary">Contact</button>
        <button className="btn-secondary">Save Profile</button>
      </div>
    </section>
  );
}
