"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../utils";

export default function ModerationQueue() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/moderation/jobs?page=${page}&limit=10`);
      setData(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page]);

  const moderateJob = async (id: string, status: string, reason?: string) => {
    try {
      await apiFetch(`/api/admin/moderation/jobs/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ moderationStatus: status, reason }),
      });
      fetchJobs();
    } catch (err: any) {
      alert("Failed to moderate job: " + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3>Moderation Queue</h3>
      {loading ? (
        <div>Loading flagged jobs...</div>
      ) : (
        <>
          {data?.jobs.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', background: '#f9fafb' }}>No flagged jobs in queue.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {data?.jobs.map((job: any) => (
                <div key={job.id} className="card" style={{ padding: '15px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h4>{job.title}</h4>
                    <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>{job.description}</p>
                    <div style={{ marginTop: '10px', fontSize: '12px' }}>
                      <strong>Client:</strong> {job.client?.fullName} ({job.client?.email})
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => moderateJob(job.id, 'APPROVED')} style={{ padding: '8px 16px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px' }}>Approve</button>
                    <button onClick={() => {
                      const reason = prompt("Reason for rejection:");
                      if (reason !== null) moderateJob(job.id, 'REJECTED', reason);
                    }} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px' }}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>Total: {data?.total || 0} flagged jobs</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button disabled={page === 1} onClick={() => setPage(page - 1)} style={{ padding: '8px 16px' }}>Previous</button>
              <button disabled={data?.jobs?.length < 10} onClick={() => setPage(page + 1)} style={{ padding: '8px 16px' }}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
