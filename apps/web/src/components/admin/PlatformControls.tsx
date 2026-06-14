import { useEffect, useState } from 'react'

export default function PlatformControls() {
  const [controls, setControls] = useState({})
  const [confirm, setConfirm] = useState(null)
  
  const fetchControls = async () => {
    try { const r=await fetch('/api/admin/controls'); setControls(await r.json()) } catch(e){}
  }
  useEffect(()=>{fetchControls()},[])
  
  const toggle = async (key) => {
    await fetch('/api/admin/controls/'+key, { method: 'POST' })
    setConfirm(null); fetchControls()
  }
  
  const controls_list = [
    { key: 'registrations', label: 'New User Registrations' },
    { key: 'jobPostings', label: 'New Job Postings' },
  ]
  
  return (
    <div>
      <h2 className='text-2xl font-bold mb-4'>Platform Controls</h2>
      {controls_list.map(c => (
        <div key={c.key} className='bg-white rounded-lg shadow p-4 mb-4 flex items-center justify-between'>
          <div>
            <div className='font-medium'>{c.label}</div>
            <div className='text-sm text-gray-500'>Currently: {controls[c.key] ? 'Enabled' : 'Disabled'}</div>
          </div>
          <button onClick={()=>setConfirm(c.key)}
            className={'px-4 py-2 rounded '+(controls[c.key]?'bg-red-500':'bg-green-500')+' text-white'}>
            {controls[c.key] ? 'Disable' : 'Enable'}
          </button>
        </div>
      ))}
      {confirm && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center' onClick={()=>setConfirm(null)}>
          <div className='bg-white p-6 rounded-lg' onClick={e=>e.stopPropagation()}>
            <p className='mb-4'>Are you sure you want to change this setting?</p>
            <div className='space-x-2'>
              <button onClick={()=>toggle(confirm)} className='px-4 py-2 bg-blue-500 text-white rounded'>Confirm</button>
              <button onClick={()=>setConfirm(null)} className='px-4 py-2 bg-gray-200 rounded'>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
