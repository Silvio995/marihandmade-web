import { expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware, config } from '@/middleware'
it('leaves session authorization to route handlers without injecting identity', async () => {
  const response = await middleware(new NextRequest('http://web.test/profile'))
  expect(response.headers.get('x-middleware-next')).toBe('1')
  expect(response.headers.get('X-USER-ID')).toBeNull()
  expect(config.matcher).toContain('/profile/:path*')
})
