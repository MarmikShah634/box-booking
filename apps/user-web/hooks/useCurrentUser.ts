'use client'

import { useEffect, useState } from 'react'

export interface CurrentUser {
  id: string
  name: string
  phone: string
  email?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch(`${BASE_URL}/api/v1/auth/user/me`, {
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Not authenticated')
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null)
          setError('Not authenticated')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { user, loading, error }
}
