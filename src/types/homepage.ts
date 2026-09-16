import type { LucideIcon } from 'lucide-react'

export type Category = {
  id: string | number
  name: string
  slug: string
  image: string
}

export type CategoryCard = {
  id: string | number
  title: string
  description: string
  slug: string
  image: string
  cta?: string
}

export type HeroProps = {
  images: string[]
  logo: string
}

export type CategoriesSectionProps = {
  categories: CategoryCard[]
}

export type BrandStorySectionProps = {
  image: string
}

export type KitHighlightSectionProps = {
  kitImage: string
}

export type WhyChooseUsFeature = {
  title: string
  description: string
  icon: LucideIcon
}

export type WhyChooseUsSectionProps = {
  features?: WhyChooseUsFeature[]
}

export type CarouselProps = {
  images: string[]
}

export type AtelierProps = {
  images: string[]
}

export type HomeHeroContent = {
  imageUrl: string
  mobileImageUrl?: string | null
  altText: string
  linkUrl?: string | null
}

export type HomeCarouselSlideContent = {
  id: string
  imageUrl: string
  mobileImageUrl?: string | null
  altText: string
  title?: string | null
  subtitle?: string | null
  linkUrl?: string | null
}
