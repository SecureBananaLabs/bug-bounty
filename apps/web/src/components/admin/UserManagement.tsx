import { useEffect, useState } from 'react'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users?page='+page+'&search='+encodeURIComponent(search))
      const data = await res.json()
      setUsers(data.users || [])
    } catch(e) { setUsers([]) }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [page, search])

  const toggleUser = async (id, action) => {
    await fetch('/api/admin/users/'+id+'/'+action, { method: 'POST' })
    fetchUsers()
  }

  return (
    <div>
      <h2 className='text-2xl font-bold mb-4'>User Management</h2>
      <input placeholder='Search by name or email...' value={search} onChange={e => {setSearch(e.target.value);setPage(1)}}
        className='border p-2 rounded w-full mb-4' aria-label='Search users' />
      {loading ? <div>Loading...</div> :
        <table className='w-full bg-white rounded shadow' role='table'>
          <thead><tr className='bg-gray-100'>
            <th className='p-2 text-left'>Name</th><th className='p-2 text-left'>Email</th>
            <th className='p-2 text-left'>Role</th><th className='p-2 text-left'>Status</th>
            <th className='p-2 text-left'>Joined</th><th className='p-2'>Actions</th>
          </tr></thead>
          <tbody>{users.map(u => (
            <tr key={u.id} className='border-t'>
              <td className='p-2'>{u.name}</td><td className='p-2'>{u.email}</td>
              <td className='p-2'>{u.role}</td>
              <td className='p-2'><span className={'px-2 py-1 rounded text-sm '+(u.status==='active'?'bg-green-100':'bg-red-100')}>{u.status}</span></td>
              <td className='p-2'>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td className='p-2 space-x-1'>
                <button onClick={()=>toggleUser(u.id,'suspend')} className='px-2 py-1 bg-yellow-500 text-white rounded text-sm'>Suspend</button>
                <button onClick={()=>toggleUser(u.id,'ban')} className='px-2 py-1 bg-red-500 text-white rounded text-sm'>Ban</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      }
      <div className='mt-4 space-x-2'>
        <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className='px-3 py-1 bg-gray-200 rounded'>Prev</button>
        <span className='px-2'>Page {page}</span>
        <button onClick={()=>setPage(p=>p+1)} className='px-3 py-1 bg-gray-200 rounded'>Next</button>
      </div>
    </div>
  )
}
