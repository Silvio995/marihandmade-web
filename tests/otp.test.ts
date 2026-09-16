import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as requestOtp } from '@/app/api/auth/otp/phone/try/route'
import { POST as verifyOtp } from '@/app/api/auth/otp/phone/verify/route'
describe('retired legacy OTP endpoints', () => {
  it.each([requestOtp, verifyOtp])('returns 410 without issuing a session', async handler => {
    const response = await handler(new NextRequest('http://web.test/api/auth/otp/phone', { method: 'POST' }))
    expect(response.status).toBe(410)
    expect(response.headers.get('set-cookie')).toBeNull()
    expect(await response.json()).toEqual({ error: 'Legacy OTP customer login is no longer available.' })
  })
})
