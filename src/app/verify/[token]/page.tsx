import { Button } from '@/components/ui/button'

export default function VerifyPage({ params }: { params: { token: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md rounded-lg border p-6 space-y-4">
        <h1 className="text-xl font-semibold">Verify email</h1>
        <form className="space-y-3" action="/api/auth/verify/confirm" method="post">
          <input type="hidden" name="token" value={params.token} />
          <Button type="submit" className="w-full">
            Verify
          </Button>
        </form>
      </div>
    </div>
  )
}
