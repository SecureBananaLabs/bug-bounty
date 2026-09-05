import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import './PlatformControls.css';

export default function PlatformControls() {
    const { token } = useAuth();
    const [registrationsEnabled, setRegistrationsEnabled] = useState(true);
    const [jobPostingEnabled, setJobPostingEnabled] = useState(true);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        fetchControls();
    }, []);

    const fetchControls = async () => {
        try {
            const res = await api.get('/admin/controls', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRegistrationsEnabled(res.data.registrationsEnabled);
            setJobPostingEnabled(res.data.jobPostingEnabled);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        try {
            await api.put('/admin/controls', {
                registrationsEnabled,
                jobPostingEnabled
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSaveMessage('Settings saved successfully.');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (err) {
            setSaveMessage('Failed to save settings.');
        }
    };

    return (
        <div className="platform-controls-container">
            <h2>Platform Controls</h2>
            <div className="control-item">
                <label>
                    <input type="checkbox" checked={registrationsEnabled} onChange={(e) => setRegistrationsEnabled(e.target.checked)} />
                    Enable new user registrations
                </label>
            </div>
            <div className="control-item">
                <label>
                    <input type="checkbox" checked={jobPostingEnabled} onChange={(e) => setJobPostingEnabled(e.target.checked)} />
                    Enable new job postings
                </label>
            </div>
            <button onClick={handleSave}>Save</button>
            {saveMessage && <p className="save-message">{saveMessage}</p>}
        </div>
    );
}