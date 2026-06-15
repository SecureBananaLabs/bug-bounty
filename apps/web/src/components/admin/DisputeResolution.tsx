import { useEffect, useState } from 'react'

export default function DisputeResolution() {
  const [disputes, setDisputes] = useState([]); const [loading, setLoading] = useState(true); const [selected, setSelected] = useState(null)
  const fetchDisputes = async () => {
    try { const r=await fetch('/api/admin/disputes'); setDisputes((await r.json()).disputes||[])
    } catch(e){} setLoading(false)
  }
  useEffect(()=>{fetchDisputes()},[])
  const rule = async (id, verdict) => {
    await fetch('/api/admin/disputes/'+id+'/rule',{method:'POST',body:JSON.stringify({verdict})})
    fetchDisputes()
  }
  return (
    <div>
      <h2 className='text-2xl font-bold mb-4'>Dispute Resolution</h2>
      {loading ? <div>Loading...</div> :
        <table className='w-full bg-white rounded shadow'>
          <thead><tr className='bg-gray-100'><th className='p-2'>ID</th><th className='p-2'>Parties</th><th className='p-2'>Status</th><th className='p-2'>Actions</th></tr></thead>
          <tbody>{disputes.map(d => (
            <tr key={d.id} className='border-t'>
              <td className='p-2'>#{d.id}</td><td className='p-2'>{d.freelancer} vs {d.client}</td>
              <td className='p-2'>{d.status}</td>
              <td className='p-2 space-x-1'>
                <button onClick={()=>setSelected(d)} className='px-2 py-1 bg-blue-500 text-white rounded text-sm'>View</button>
                <button onClick={()=>rule(d.id,'freelancer')} className='px-2 py-1 bg-green-500 text-white rounded text-sm'>Rule for Freelancer</button>
                <button onClick={()=>rule(d.id,'client')} className='px-2 py-1 bg-orange-500 text-white rounded text-sm'>Rule for Client</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      }
      {selected && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center' onClick={()=>setSelected(null)}>
          <div className='bg-white p-6 rounded-lg max-w-lg' onClick={e=>e.stopPropagation()}>
            <h3 className='text-xl font-bold mb-4'>Dispute #{selected.id}</h3>
            <p><strong>Parties:</strong> {selected.freelancer} vs {selected.client}</p>
            <p><strong>Status:</strong> {selected.status}</p>
            <p className='mt-2'>{selected.description}</p>
            <button onClick={()=>setSelected(null)} className='mt-4 px-3 py-1 bg-gray-200 rounded'>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
