'use client'

import { Button } from '@/components/ui/button'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const email = formData.get('email')?.toString()
    const password = formData.get('password')?.toString()
    const result = await signIn('credentials', {
      redirect: true,
      callbackUrl: '/',
      email,
      password,
    })
    if (result?.error) setError(result.error)
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
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Login'}
      </Button>
      <Link href="/signup" className="text-sm underline">
        Create an account
      </Link>
      <Link href="/reset" className="text-sm underline">
        Forgot password?
      </Link>
    </form>
  )
}
