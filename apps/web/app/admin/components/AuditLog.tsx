"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../utils";

export default function AuditLog() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionType, setActionType] = useState("");
  const [adminId, setAdminId] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (actionType) query.append("actionType", actionType);
      if (adminId) query.append("adminId", adminId);
      
      const res = await apiFetch(`/api/admin/audit-logs?${query}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionType, adminId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3>Audit Log</h3>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Filter by Admin ID..." 
          value={adminId} 
          onChange={(e) => { setAdminId(e.target.value); setPage(1); }} 
          style={{ padding: '8px', flex: 1 }}
        />
        <input 
          type="text" 
          placeholder="Filter by Action Type..." 
          value={actionType} 
          onChange={(e) => { setActionType(e.target.value); setPage(1); }} 
          style={{ padding: '8px', flex: 1 }}
        />
      </div>

      {loading ? (
        <div>Loading logs...</div>
      ) : (
        <div className="card" style={{ padding: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ padding: '10px' }}>Timestamp</th>
                <th style={{ padding: '10px' }}>Admin ID</th>
                <th style={{ padding: '10px' }}>Action</th>
                <th style={{ padding: '10px' }}>Target</th>
                <th style={{ padding: '10px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {data?.logs.map((log: any) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '10px' }}>{log.adminId}</td>
                  <td style={{ padding: '10px' }}><strong>{log.action}</strong></td>
                  <td style={{ padding: '10px' }}>{log.targetType} {log.targetId && `(${log.targetId})`}</td>
                  <td style={{ padding: '10px' }}>
                    <pre style={{ margin: 0, fontSize: '12px', background: '#f4f4f4', padding: '5px' }}>
                      {log.details ? JSON.stringify(JSON.parse(log.details), null, 2) : '-'}
                    </pre>
                  </td>
                </tr>
              ))}
              {data?.logs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>No audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
            <div>Total: {data?.total || 0} logs</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button disabled={page === 1} onClick={() => setPage(page - 1)} style={{ padding: '8px 16px' }}>Previous</button>
              <button disabled={data?.logs?.length < 20} onClick={() => setPage(page + 1)} style={{ padding: '8px 16px' }}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
