import { useState, useEffect } from 'react';
import { DataTable } from '../DataTable';
import { User } from '../../types';

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setUsers(data));
  }, [filters]);

  const handleAction = async (userId: string, action: string) => {
    await fetch(`/api/admin/users/${userId}/${action}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    setUsers(users.filter(user => user.id !== userId));
  };

  return (
    <section className="admin-section">
      <h2>User Management</h2>
      <DataTable
        columns={['ID', 'Username', 'Role', 'Status', 'Joined', 'Actions']}
        data={users}
        filters={filters}
        onFilter={setFilters}
      />
      {/* Action buttons implementation */}
    </section>
  );
};
