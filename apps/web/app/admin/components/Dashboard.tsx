"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../utils";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/admin/metrics");
      setData(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Trust & Metrics Dashboard</h3>
        <button onClick={fetchMetrics} style={{ padding: '8px 16px' }}>Refresh Data</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <h4>Total Users</h4>
          <p style={{ fontSize: '2em', margin: '10px 0' }}>{data.totalUsers}</p>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <h4>Active Jobs</h4>
          <p style={{ fontSize: '2em', margin: '10px 0' }}>{data.activeJobs}</p>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <h4>Open Disputes</h4>
          <p style={{ fontSize: '2em', margin: '10px 0' }}>{data.openDisputes}</p>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <h4>Flagged Listings</h4>
          <p style={{ fontSize: '2em', margin: '10px 0' }}>{data.flaggedListings}</p>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <h4>Revenue</h4>
          <p style={{ fontSize: '2em', margin: '10px 0' }}>${data.revenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <h4>Trust Score Distribution</h4>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', height: '200px', alignItems: 'flex-end' }}>
          {data.trustScoreDistribution.map((item: any) => (
            <div key={item.range} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                width: '100%', 
                backgroundColor: '#3b82f6', 
                height: `${(item.count / Math.max(...data.trustScoreDistribution.map((d:any) => d.count))) * 100}%`,
                minHeight: '20px',
                borderRadius: '4px 4px 0 0'
              }}></div>
              <span style={{ fontSize: '12px', marginTop: '5px' }}>{item.range}</span>
              <span style={{ fontSize: '10px', color: '#666' }}>{item.count} users</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
