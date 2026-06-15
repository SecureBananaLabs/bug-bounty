import { useEffect, useState } from 'react'

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/metrics');
      const data = await res.json()
      setMetrics(data)
    } catch(e) { setMetrics(null) }
    setLoading(false)
  }
  
  useEffect(() => { fetchMetrics() }, [])
  
  if (loading) return <div className='p-4'>Loading metrics...</div>
  if (!metrics) return <div className='p-4 text-red-500'>Failed to load metrics</div>
  
  const cards = [
    { label: 'Total Users', value: metrics.totalUsers },
    { label: 'Active Jobs', value: metrics.activeJobs },
    { label: 'Open Disputes', value: metrics.openDisputes },
    { label: 'Flagged Listings', value: metrics.flaggedListings },
    { label: 'Revenue', value: '$' + (metrics.revenue || 0).toLocaleString() },
  ]
  
  return (
    <div>
      <h2 className='text-2xl font-bold mb-4'>Platform Metrics</h2>
      <div className='grid grid-cols-5 gap-4 mb-6'>
        {cards.map(c => (
          <div key={c.label} className='bg-white rounded-lg shadow p-4'>
            <div className='text-sm text-gray-500'>{c.label}</div>
            <div className='text-2xl font-bold mt-1'>{c.value}</div>
          </div>
        ))}
      </div>
      <button onClick={fetchMetrics} className='px-3 py-1 bg-blue-500 text-white rounded'>Refresh</button>
    </div>
  )
}
