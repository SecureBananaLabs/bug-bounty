"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../utils";

export default function DisputeQueue() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("OPEN");

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: page.toString(), limit: "10" });
      if (statusFilter) query.append("status", statusFilter);
      const res = await apiFetch(`/api/admin/disputes?${query}`);
      setData(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [page, statusFilter]);

  const resolveDispute = async (id: string) => {
    const ruling = prompt("Rule in favour of (CLIENT or FREELANCER):");
    if (!['CLIENT', 'FREELANCER'].includes(ruling?.toUpperCase() || '')) {
      return alert("Invalid ruling party.");
    }
    const resolution = prompt("Resolution details:");
    if (!resolution) return;

    try {
      await apiFetch(`/api/admin/disputes/${id}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ rulingInFavourOf: ruling?.toUpperCase(), resolution }),
      });
      fetchDisputes();
    } catch (err: any) {
      alert("Failed to resolve: " + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Dispute Resolution</h3>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: '8px' }}>
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {loading ? (
        <div>Loading disputes...</div>
      ) : (
        <>
          {data?.disputes.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', background: '#f9fafb' }}>No disputes found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {data?.disputes.map((d: any) => (
                <div key={d.id} className="card" style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong>Job: {d.job?.title}</strong>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                      backgroundColor: d.status === 'RESOLVED' ? '#dcfce7' : '#fef08a'
                    }}>{d.status}</span>
                  </div>
                  <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                    <div><strong>Client:</strong> {d.client?.fullName}</div>
                    <div><strong>Freelancer:</strong> {d.freelancer?.fullName}</div>
                  </div>
                  <p style={{ fontSize: '14px', color: '#444', marginBottom: '15px' }}>
                    <strong>Reason:</strong> {d.reason}
                  </p>
                  
                  {d.status !== 'RESOLVED' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => resolveDispute(d.id)} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px' }}>Resolve Dispute</button>
                    </div>
                  )}
                  {d.status === 'RESOLVED' && (
                    <div style={{ fontSize: '14px', color: '#166534', background: '#dcfce7', padding: '10px', borderRadius: '4px' }}>
                      <strong>Resolution:</strong> {d.resolution}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>Total: {data?.total || 0} disputes</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button disabled={page === 1} onClick={() => setPage(page - 1)} style={{ padding: '8px 16px' }}>Previous</button>
              <button disabled={data?.disputes?.length < 10} onClick={() => setPage(page + 1)} style={{ padding: '8px 16px' }}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
