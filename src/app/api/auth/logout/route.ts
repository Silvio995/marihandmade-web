import { forwardAuth } from '@/lib/auth-forwarding'
export const dynamic = 'force-dynamic'
export function POST(request: Request) { return forwardAuth(request, 'logout') }
