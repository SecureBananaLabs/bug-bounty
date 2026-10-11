"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../utils";

export default function UsersList() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(role && { role }),
        ...(status && { status }),
      });
      const res = await apiFetch(`/api/admin/users?${query}`);
      setData(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, role, status]);

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      await apiFetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchUsers();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3>User Management</h3>
      
      <div style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Search by email or name..." 
          value={search} 
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
          style={{ padding: '8px', flex: 1 }}
        />
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} style={{ padding: '8px' }}>
          <option value="">All Roles</option>
          <option value="CLIENT">Client</option>
          <option value="FREELANCER">Freelancer</option>
          <option value="ADMIN">Admin</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ padding: '8px' }}>
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
      </div>

      {loading ? (
        <div>Loading users...</div>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ padding: '10px' }}>Name / Email</th>
                <th style={{ padding: '10px' }}>Role</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Joined</th>
                <th style={{ padding: '10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map((user: any) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>
                    <div>{user.fullName}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>
                  </td>
                  <td style={{ padding: '10px' }}>{user.role}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      backgroundColor: user.status === 'ACTIVE' ? '#dcfce7' : user.status === 'SUSPENDED' ? '#fef08a' : '#fee2e2',
                      color: user.status === 'ACTIVE' ? '#166534' : user.status === 'SUSPENDED' ? '#854d0e' : '#991b1b'
                    }}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '10px', display: 'flex', gap: '5px' }}>
                    {user.status !== 'ACTIVE' && (
                      <button onClick={() => updateUserStatus(user.id, 'ACTIVE')} style={{ padding: '4px 8px' }}>Reinstate</button>
                    )}
                    {user.status !== 'SUSPENDED' && (
                      <button onClick={() => updateUserStatus(user.id, 'SUSPENDED')} style={{ padding: '4px 8px' }}>Suspend</button>
                    )}
                    {user.status !== 'BANNED' && (
                      <button onClick={() => updateUserStatus(user.id, 'BANNED')} style={{ padding: '4px 8px', color: 'red' }}>Ban</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>Total: {data?.total} users</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button disabled={page === 1} onClick={() => setPage(page - 1)} style={{ padding: '8px 16px' }}>Previous</button>
              <button disabled={data?.users.length < 10} onClick={() => setPage(page + 1)} style={{ padding: '8px 16px' }}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
