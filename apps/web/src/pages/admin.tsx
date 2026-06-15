// Admin Panel
import { AdminGuard } from '../components/admin/AdminGuard'
import { AdminLayout } from '../components/admin/AdminLayout'
import { useState } from 'react'
import dynamic from 'next/dynamic'

const Sections = {
  users: dynamic(() => import('../components/admin/UserManagement')),
  moderation: dynamic(() => import('../components/admin/ModerationQueue')),
  disputes: dynamic(() => import('../components/admin/DisputeResolution')),
  metrics: dynamic(() => import('../components/admin/MetricsDashboard')),
  controls: dynamic(() => import('../components/admin/PlatformControls')),
  audit: dynamic(() => import('../components/admin/AuditLog')),
}

export default function AdminPage() {
  const [section, setSection] = useState('metrics')
  const SectionComponent = Sections[section]
  return (
    <AdminGuard>
      <AdminLayout section={section} onNavigate={setSection}>
        {SectionComponent && <SectionComponent.Skeleton />}
      </AdminLayout>
    </AdminGuard>
  )
}
