export type EditorialLink = {
  label: string
  href: string
}

// Official editorial source for storefront home content.
export type EditorialImageItem = {
  src: string
  alt: string
  label?: string
}

export type EditorialCollection = {
  title: string
  description: string
  ctaLabel: string
  href: string
  image: string
  alt: string
  isFuture?: boolean
  statusLabel?: string
}

export const homepageEditorialFooter = {
  labels: {
    navigation: 'Navigazione',
    social: 'Atelier Online',
  },
  brand: {
    label: 'Marì Atelier',
    description:
      'Atelier indipendente di creazioni crochet artigianali: collezioni curate, pezzi unici e progetti personalizzati.',
  },
  navigation: [
    { label: 'Catalogo', href: '/products' },
    { label: 'Collezioni', href: '/products' },
    { label: 'Atelier', href: '/about-us' },
  ] as EditorialLink[],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Termini', href: '/terms' },
  ] as EditorialLink[],
  social: [
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/maria_firelli?utm_source=qr&igsh=NWVobDJkMHd2dno0',
    },
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/mariafirelli?rdid=nEVCD2IDZCJP0Bn1&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F17PnH4WYRa%2F#',
    },
    {
      label: 'WhatsApp',
      href: '/contact',
    },
    {
      label: 'TikTok',
      href: 'https://www.tiktok.com/@marihandmadeofficial?_r=1&_t=ZN-94HHmZniBL4',
    },
  ] as EditorialLink[],
} as const
