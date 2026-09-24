vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock('@/state/Auth', () => ({ AuthProvider: ({ children }: { children: React.ReactNode }) => children, useAuth: () => ({ status: 'unauthenticated', session: null }) }))
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const { userProviderSpy, cartProviderSpy } = vi.hoisted(() => ({
  userProviderSpy: vi.fn(({ children }) => children),
  cartProviderSpy: vi.fn(({ children }) => children),
}))

vi.mock('@/state/User', () => ({
  UserContextProvider: userProviderSpy,
  useUserContext: () => ({ user: null, loading: false, refreshUser: vi.fn() }),
}))

vi.mock('@/state/Cart', () => ({
  CartContextProvider: cartProviderSpy,
  useCartContext: () => ({ cart: null, loading: false, refreshCart: vi.fn(), dispatchCart: vi.fn() }),
}))

import { Providers } from '@/app/providers'

describe('Providers wrapper', () => {
  it('wraps children with UserContextProvider and CartContextProvider', () => {
    const { getByText } = render(
      <Providers>
        <span>child</span>
      </Providers>
    )

    expect(userProviderSpy).toHaveBeenCalled()
    expect(cartProviderSpy).toHaveBeenCalled()
    expect(getByText('child')).toBeInTheDocument()
  })
})
