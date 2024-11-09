import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export const withAuth = (WrappedComponent: React.ComponentType) => {
  return function WithAuthComponent(props: any) {
    const router = useRouter()
    const { user, loading } = useAuth()

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login')
      }
    }, [user, loading, router])

    if (loading) {
      return <div>Loading...</div>
    }

    return user ? <WrappedComponent {...props} /> : null
  }
} 