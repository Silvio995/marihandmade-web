import { forwardAuth } from '@/lib/auth-forwarding'
export const dynamic = 'force-dynamic'
export function GET(request: Request) { return forwardAuth(request, 'me') }
