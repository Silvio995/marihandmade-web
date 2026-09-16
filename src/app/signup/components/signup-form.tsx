'use client'

import { Button } from '@/components/ui/button'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function SignupForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const email = formData.get('email')?.toString()
    const password = formData.get('password')?.toString()
    const confirmPassword = formData.get('confirmPassword')?.toString()
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, confirmPassword }),
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) {
      const text = await res.text()
      setError(text || 'Signup failed')
      setLoading(false)
      return
    }
    await signIn('credentials', { email, password, callbackUrl: '/' })
    setLoading(false)
  }

  return (
    <form className="grid gap-4" action={handleSubmit}>
      <div className="grid gap-1">
        <label className="text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          className="rounded-md border px-3 py-2 text-sm"
          required
        />
      </div>
      <div className="grid gap-1">
        <label className="text-sm font-medium">Password</label>
        <input
          name="password"
          type="password"
          className="rounded-md border px-3 py-2 text-sm"
          required
          minLength={6}
        />
      </div>
      <div className="grid gap-1">
        <label className="text-sm font-medium">Confirm password</label>
        <input
          name="confirmPassword"
          type="password"
          className="rounded-md border px-3 py-2 text-sm"
          required
          minLength={6}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Sign up'}
      </Button>
    </form>
  )
}
