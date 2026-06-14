const NAV = [
  { id: 'metrics', label: 'Dashboard', icon: '📊' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'moderation', label: 'Moderation', icon: '🚩' },
  { id: 'disputes', label: 'Disputes', icon: '⚖️' },
  { id: 'controls', label: 'Controls', icon: '⚙️' },
  { id: 'audit', label: 'Audit Log', icon: '📋' },
]

export function AdminLayout({ section, onNavigate, children }) {
  return (
    <div className='flex min-h-screen'>
      <nav className='w-56 bg-gray-900 text-white p-4 space-y-2' role='navigation' aria-label='Admin navigation'>
        <h2 className='text-lg font-bold mb-4'>Admin Panel</h2>
        {NAV.map(n => (
          <button key={n.id} onClick={() => onNavigate(n.id)} role='tab' aria-selected={n.id===section}
            className={'w-full text-left px-3 py-2 rounded ' + (n.id===section ? 'bg-blue-600' : 'hover:bg-gray-700')}
          >{n.icon} {n.label}</button>
        ))}
      </nav>
      <main className='flex-1 p-6 bg-gray-50' role='main'>{children}</main>
    </div>
  )
}
