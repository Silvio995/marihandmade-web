'use client'
import { useAuth } from '@/state/Auth'
export function useAuthenticated() {
  const { status } = useAuth()
  return { authenticated: status === 'authenticated', loading: status === 'loading', error: status === 'error' }
}
