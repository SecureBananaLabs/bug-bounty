import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

export function AdminGuard({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  if (status === 'loading') return <div className='p-8 text-center'>Loading...</div>
  if (!session) { router.replace('/login'); return null }
  if (session.user.role !== 'admin') return <div className='p-8 text-center text-red-500'>403 - Access Denied</div>
  
  return <>{children}</>
}
