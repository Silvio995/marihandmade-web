import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { pushSpy, useAuthenticatedMock } = vi.hoisted(() => ({ pushSpy: vi.fn(), useAuthenticatedMock: vi.fn(() => ({ authenticated: true })) }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushSpy }),
}))



vi.mock('@/hooks/useAuthentication', () => ({
  useAuthenticated: useAuthenticatedMock,
}))

vi.mock('@/state/User', () => ({
  useUserContext: () => ({ user: { id: 'u1' }, loading: false }),
}))

import WishlistPage from '@/app/(store)/(routes)/wishlist/page'

afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

const sampleProduct = {
  id: 'p1',
  title: 'Prodotto 1',
  price: 10,
  images: ['https://example.com/img.jpg'],
  categories: [{ title: 'Cat' }],
  brand: { title: 'Brand' },
}

describe('Wishlist page', () => {
  it('renders products when wishlist has items', async () => {
    useAuthenticatedMock.mockReturnValue({ authenticated: true })
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: async () => [sampleProduct],
    } as any)

    render(<WishlistPage />)

    await waitFor(() => {
      expect(screen.getByText('Prodotto 1')).toBeInTheDocument()
    })
  })

  it('shows empty state when wishlist is empty', async () => {
    useAuthenticatedMock.mockReturnValue({ authenticated: true })
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: async () => [],
    } as any)

    render(<WishlistPage />)

    await waitFor(() => {
      expect(
        screen.getByText(/Nessun articolo in wishlist/i)
      ).toBeInTheDocument()
    })
  })

  it('redirects to login when unauthenticated', async () => {
    useAuthenticatedMock.mockReturnValue({ authenticated: false })

    render(<WishlistPage />)

    await waitFor(() => {
      expect(pushSpy).toHaveBeenCalledWith('/login')
    })
  })

  it('handles fetch error gracefully', async () => {
    useAuthenticatedMock.mockReturnValue({ authenticated: true })
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('fail'))

    render(<WishlistPage />)

    await waitFor(() => {
      expect(
        screen.getByText(/Nessun articolo in wishlist/i)
      ).toBeInTheDocument()
    })
  })
})
