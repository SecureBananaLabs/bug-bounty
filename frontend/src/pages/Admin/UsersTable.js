import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import './UsersTable.css';

export default function UsersTable() {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data.users);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = async (userId) => {
        try {
            await api.post(`/admin/users/${userId}/suspend`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (err) {
            alert('Failed to suspend user');
        }
    };

    const handleReinstate = async (userId) => {
        try {
            await api.post(`/admin/users/${userId}/reinstate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (err) {
            alert('Failed to reinstate user');
        }
    };

    const handleBan = async (userId) => {
        if (!window.confirm('Are you sure you want to permanently ban this user?')) return;
        try {
            await api.post(`/admin/users/${userId}/ban`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (err) {
            alert('Failed to ban user');
        }
    };

    const filteredUsers = users.filter(u => {
        const nameMatch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const roleMatch = roleFilter === 'all' || u.role === roleFilter;
        const statusMatch = statusFilter === 'all' || u.status === statusFilter;
        return nameMatch && roleMatch && statusMatch;
    });

    if (loading) return <div>Loading users...</div>;

    return (
        <div className="users-table-container">
            <h2>User Management</h2>
            <div className="filters">
                <input type="text" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="all">All Roles</option>
                    <option value="client">Client</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="admin">Admin</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                </select>
                <button onClick={fetchUsers}>Refresh</button>
            </div>
            <table className="users-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Join Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map(u => (
                        <tr key={u._id}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td>{u.status}</td>
                            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td>
                                {u.status === 'active' && <button onClick={() => handleSuspend(u._id)}>Suspend</button>}
                                {u.status === 'suspended' && <button onClick={() => handleReinstate(u._id)}>Reinstate</button>}
                                {u.status !== 'banned' && <button onClick={() => handleBan(u._id)}>Ban</button>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}