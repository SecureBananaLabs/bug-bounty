import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import './DisputeQueue.css';

export default function DisputeQueue() {
    const { token } = useAuth();
    const [disputes, setDisputes] = useState([]);
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        try {
            const res = await api.get('/admin/disputes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDisputes(res.data.disputes);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRule = async (disputeId, ruling) => {
        try {
            await api.post(`/admin/disputes/${disputeId}/rule`, { ruling }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDisputes();
            setSelectedDispute(null);
        } catch (err) {
            alert('Failed to rule on dispute');
        }
    };

    const handleEscalate = async (disputeId) => {
        try {
            await api.post(`/admin/disputes/${disputeId}/escalate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchDisputes();
            setSelectedDispute(null);
        } catch (err) {
            alert('Failed to escalate dispute');
        }
    };

    if (loading) return <div>Loading disputes...</div>;

    return (
        <div className="dispute-queue-container">
            <h2>Dispute Resolution</h2>
            <button onClick={fetchDisputes}>Refresh</button>
            {disputes.length === 0 ? <p>No open disputes.</p> : (
                <table className="disputes-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Freelancer</th>
                            <th>Client</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {disputes.map(d => (
                            <tr key={d._id}>
                                <td>{d._id}</td>
                                <td>{d.freelancer?.name}</td>
                                <td>{d.client?.name}</td>
                                <td>{d.status}</td>
                                <td>
                                    <button onClick={() => setSelectedDispute(d)}>View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {selectedDispute && (
                <div className="dispute-detail">
                    <h3>Dispute Detail</h3>
                    <p><strong>Freelancer:</strong> {selectedDispute.freelancer?.name}</p>
                    <p><strong>Client:</strong> {selectedDispute.client?.name}</p>
                    <p><strong>Status:</strong> {selectedDispute.status}</p>
                    <p><strong>Description:</strong> {selectedDispute.description}</p>
                    <h4>Thread</h4>
                    {selectedDispute.messages?.map((msg, idx) => (
                        <div key={idx} className="message">
                            <strong>{msg.sender}:</strong> {msg.text}
                        </div>
                    ))}
                    <h4>Evidence</h4>
                    {selectedDispute.evidence?.map((ev, idx) => (
                        <div key={idx}>
                            <a href={ev.url} target="_blank" rel="noreferrer">{ev.name}</a>
                        </div>
                    ))}
                    {selectedDispute.status === 'open' && (
                        <div className="ruling-actions">
                            <button onClick={() => handleRule(selectedDispute._id, 'freelancer')}>Rule in favor of Freelancer</button>
                            <button onClick={() => handleRule(selectedDispute._id, 'client')}>Rule in favor of Client</button>
                            <button onClick={() => handleEscalate(selectedDispute._id)}>Escalate to Senior Admin</button>
                        </div>
                    )}
                    <button onClick={() => setSelectedDispute(null)}>Close</button>
                </div>
            )}
        </div>
    );
}