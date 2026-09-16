import { Button } from '@/components/ui/button'

export default function ResetRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-4 rounded-lg border p-6">
        <h1 className="text-xl font-semibold">Reset password</h1>
        <p className="text-sm text-neutral-600">Enter your email to receive a reset link.</p>
        <form className="space-y-3" action="/api/auth/reset/request" method="post">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              required
              className="rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
      </div>
    </div>
  )
}
