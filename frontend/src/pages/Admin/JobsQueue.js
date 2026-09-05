import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import './JobsQueue.css';

export default function JobsQueue() {
    const { token } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await api.get('/admin/jobs/flagged', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setJobs(res.data.jobs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (jobId) => {
        try {
            await api.post(`/admin/jobs/${jobId}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchJobs();
        } catch (err) {
            alert('Failed to approve job');
        }
    };

    const handleReject = async (jobId, reason) => {
        const reasonInput = prompt('Reason for rejection:', reason || '');
        if (!reasonInput) return;
        try {
            await api.post(`/admin/jobs/${jobId}/reject`, { reason: reasonInput }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchJobs();
        } catch (err) {
            alert('Failed to reject job');
        }
    };

    const handleEscalate = async (jobId) => {
        try {
            await api.post(`/admin/jobs/${jobId}/escalate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchJobs();
        } catch (err) {
            alert('Failed to escalate job');
        }
    };

    if (loading) return <div>Loading flagged jobs...</div>;

    return (
        <div className="jobs-queue-container">
            <h2>Job Moderation Queue</h2>
            <button onClick={fetchJobs}>Refresh</button>
            {jobs.length === 0 ? <p>No flagged jobs.</p> : (
                <table className="jobs-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Posted By</th>
                            <th>Flagged Reason</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map(job => (
                            <tr key={job._id}>
                                <td>{job.title}</td>
                                <td>{job.postedBy?.name || 'Unknown'}</td>
                                <td>{job.flaggedReason}</td>
                                <td>{new Date(job.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button onClick={() => handleApprove(job._id)}>Approve</button>
                                    <button onClick={() => handleReject(job._id, job.flaggedReason)}>Reject</button>
                                    <button onClick={() => handleEscalate(job._id)}>Escalate</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}