'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

type Props = {
  initialData: {
    name: string | null
    phone: string | null
    email: string | null
  } | null
}

export default function ProfileForm({ initialData }: Props) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [phone, setPhone] = useState(initialData?.phone ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Update failed')
      }
      toast.success('Profile updated.')
    } catch (err: any) {
      toast.error(err?.message || 'Unable to update')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-1">
        <label className="text-sm font-medium">Name</label>
        <input
          className="rounded-md border px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
      </div>
      <div className="grid gap-1">
        <label className="text-sm font-medium">Phone</label>
        <input
          className="rounded-md border px-3 py-2 text-sm"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
        />
      </div>
      <p className="text-sm text-neutral-600">Email changes are not supported yet.</p>
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}
