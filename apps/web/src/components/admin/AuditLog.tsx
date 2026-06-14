import { useEffect, useState } from 'react'

export default function AuditLog() {
  const [logs, setLogs] = useState([]); const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({admin:'',action:'',startDate:'',endDate:''})
  
  const fetchLogs = async () => {
    setLoading(true)
    const params = new URLSearchParams(filters).toString()
    try { const r=await fetch('/api/admin/audit?'+params); setLogs((await r.json()).logs||[]) } catch(e){}
    setLoading(false)
  }
  useEffect(()=>{fetchLogs()},[filters])
  
  return (
    <div>
      <h2 className='text-2xl font-bold mb-4'>Audit Log</h2>
      <div className='flex gap-2 mb-4'>
        <input placeholder='Admin ID' value={filters.admin} onChange={e=>setFilters({...filters,admin:e.target.value})} className='border p-1 rounded' />
        <select value={filters.action} onChange={e=>setFilters({...filters,action:e.target.value})} className='border p-1 rounded'>
          <option value=''>All Actions</option>
          <option value='ban'>Ban</option><option value='suspend'>Suspend</option>
          <option value='rule'>Ruling</option><option value='toggle'>Toggle</option>
          <option value='reject'>Rejection</option>
        </select>
        <input type='date' value={filters.startDate} onChange={e=>setFilters({...filters,startDate:e.target.value})} className='border p-1 rounded' />
        <input type='date' value={filters.endDate} onChange={e=>setFilters({...filters,endDate:e.target.value})} className='border p-1 rounded' />
      </div>
      {loading ? <div>Loading...</div> :
        <table className='w-full bg-white rounded shadow'>
          <thead><tr className='bg-gray-100'><th className='p-2 text-left'>Timestamp</th><th className='p-2 text-left'>Admin</th><th className='p-2 text-left'>Action</th><th className='p-2 text-left'>Details</th></tr></thead>
          <tbody>{logs.map((l,i) => (
            <tr key={i} className='border-t'>
              <td className='p-2'>{new Date(l.timestamp).toLocaleString()}</td>
              <td className='p-2'>{l.adminId}</td><td className='p-2'>{l.action}</td>
              <td className='p-2'>{l.details}</td>
            </tr>
          ))}</tbody>
        </table>
      }
    </div>
  )
}
