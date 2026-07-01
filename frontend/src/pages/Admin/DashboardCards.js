import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import './DashboardCards.css';

export default function DashboardCards() {
    const { token } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchMetrics = async () => {
        try {
            const res = await api.get('/admin/metrics', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMetrics(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    if (loading) return <div>Loading metrics...</div>;

    return (
        <div className="dashboard-cards">
            <h2>Platform Metrics</h2>
            <button onClick={fetchMetrics}>Refresh</button>
            <div className="cards-grid">
                <div className="card">
                    <h3>Total Users</h3>
                    <p>{metrics.totalUsers}</p>
                </div>
                <div className="card">
                    <h3>Active Jobs</h3>
                    <p>{metrics.activeJobs}</p>
                </div>
                <div className="card">
                    <h3>Open Disputes</h3>
                    <p>{metrics.openDisputes}</p>
                </div>
                <div className="card">
                    <h3>Flagged Listings</h3>
                    <p>{metrics.flaggedListings}</p>
                </div>
                <div className="card">
                    <h3>Revenue (Period)</h3>
                    <p>${metrics.revenue.toLocaleString()}</p>
                </div>
            </div>
            <div className="chart-section">
                <h3>Trust Score Distribution</h3>
                <div className="placeholder-chart">[Chart Component]</div>
            </div>
        </div>
    );
}