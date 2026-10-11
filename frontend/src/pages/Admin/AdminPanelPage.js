import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UsersTable from './UsersTable';
import JobsQueue from './JobsQueue';
import DisputeQueue from './DisputeQueue';
import DashboardCards from './DashboardCards';
import PlatformControls from './PlatformControls';
import './AdminPanelPage.css';

export default function AdminPanelPage() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/403', { replace: true });
        }
    }, [user, navigate]);

    if (!user || user.role !== 'admin') return null;

    return (
        <div className="admin-panel">
            <header className="admin-header">
                <h1>Admin Panel</h1>
                <button onClick={logout}>Logout</button>
            </header>
            <nav className="admin-nav">
                <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Users</button>
                <button className={activeTab === 'jobs' ? 'active' : ''} onClick={() => setActiveTab('jobs')}>Jobs</button>
                <button className={activeTab === 'disputes' ? 'active' : ''} onClick={() => setActiveTab('disputes')}>Disputes</button>
                <button className={activeTab === 'controls' ? 'active' : ''} onClick={() => setActiveTab('controls')}>Controls</button>
            </nav>
            <main className="admin-content">
                {activeTab === 'dashboard' && <DashboardCards />}
                {activeTab === 'users' && <UsersTable />}
                {activeTab === 'jobs' && <JobsQueue />}
                {activeTab === 'disputes' && <DisputeQueue />}
                {activeTab === 'controls' && <PlatformControls />}
            </main>
        </div>
    );
}