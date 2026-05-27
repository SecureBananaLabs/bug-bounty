import { useEffect, useState } from 'react'

export default function ModerationQueue() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true)
  const fetchItems = async () => {
    setLoading(true)
    try { const r=await fetch('/api/admin/moderation'); setItems((await r.json()).items||[])
    } catch(e){} setLoading(false)
  }
  useEffect(()=>{fetchItems()},[])
  const moderate = async (id, action) => {
    await fetch('/api/admin/moderation/'+id,{method:'POST',body:JSON.stringify({action})})
    fetchItems()
  }
  return (
    <div>
      <h2 className='text-2xl font-bold mb-4'>Moderation Queue</h2>
      {loading ? <div>Loading...</div> :
        <table className='w-full bg-white rounded shadow'>
          <thead><tr className='bg-gray-100'><th className='p-2 text-left'>Job</th><th className='p-2 text-left'>Flagged By</th><th className='p-2 text-left'>Reason</th><th className='p-2'>Actions</th></tr></thead>
          <tbody>{items.map(i => (
            <tr key={i.id} className='border-t'>
              <td className='p-2'>{i.title}</td><td className='p-2'>{i.flaggedBy}</td>
              <td className='p-2'>{i.reason}</td>
              <td className='p-2 space-x-1'>
                <button onClick={()=>moderate(i.id,'approve')} className='px-2 py-1 bg-green-500 text-white rounded text-sm'>Approve</button>
                <button onClick={()=>moderate(i.id,'reject')} className='px-2 py-1 bg-red-500 text-white rounded text-sm'>Reject</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      }
    </div>
  )
}
