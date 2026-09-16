import { Button } from '@/components/ui/button'

export default function ResetConfirmPage({ params }: { params: { token: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md space-y-4 rounded-lg border p-6">
        <h1 className="text-xl font-semibold">Set new password</h1>
        <form className="space-y-3" action="/api/auth/reset/confirm" method="post">
          <input type="hidden" name="token" value={params.token} />
          <div className="grid gap-1">
            <label className="text-sm font-medium">New password</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" className="w-full">
            Update password
          </Button>
        </form>
      </div>
    </div>
  )
}
