import { useEffect, useState } from 'react'
import api from '@/api/axios'
import { useAuthStore } from '@/store/authStore'

interface Violation {
  id: number
  reason: string
  strike_number: number
  target_type: string
  target_id: number
  resulted_in_ban: boolean
  created_at: string
}

export function useMyViolations() {
  const user = useAuthStore(s => s.user)
  const [violations, setViolations] = useState<Violation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'storyteller') {
      setViolations([])
      setLoading(false)
      return
    }
    api.get('/studio/my-violations')
      .then(res => setViolations(res.data))
      .catch(() => setViolations([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  return { violations, loading }
}