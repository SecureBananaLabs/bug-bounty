"use client";

import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";

interface TrustScoreData {
  "0-20": number;
  "21-40": number;
  "41-60": number;
  "61-80": number;
  "81-100": number;
}

export function TrustScoreChart() {
  const [data, setData] = useState<TrustScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiGet<TrustScoreData>("/admin/trust-scores");
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div style={{ padding: 16 }}>Loading trust scores...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <p className="error">Failed to load trust scores: {error}</p>
        <button onClick={load} style={{ marginTop: 8 }}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const entries = Object.entries(data);
  const maxValue = Math.max(...entries.map(([, value]) => value));

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Trust Score Distribution</h3>
        <button onClick={load} style={{ padding: "0.25rem 0.75rem", fontSize: "0.85rem" }}>
          Refresh
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        {entries.map(([range, count]) => {
          const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0;
          return (
            <div key={range} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "0.9rem" }}>
                <span>{range}</span>
                <span>{count}</span>
              </div>
              <div
                style={{
                  height: 20,
                  background: "#2a2a2a",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${percentage}%`,
                    height: "100%",
                    background: "#4a90d9",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}