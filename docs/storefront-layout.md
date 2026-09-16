# Storefront visual foundation

The current visual/motion milestone is documented in [storefront-motion.md](storefront-motion.md).

The homepage now has a warm neutral commerce hierarchy: utility bar, logo/search/customer actions, independent backend category navigation, contained hero carousel, category tiles, featured products, atelier values, disabled newsletter and multi-column footer.

## Implementation

- `src/components/native/nav/parent.tsx`: responsive header, active category states, cart quantity from existing context, GET search, mobile disclosure with Escape/focus return.
- `src/components/storefront/layout.tsx`: shared max-width container, gutters and section heading.
- `src/components/storefront/HeroCarousel.tsx`: existing Embla dependency, manual arrows/dots, accessible slide state and inactive CTA tab handling. No autoplay; smooth transitions switch to immediate navigation for reduced motion. Supports optional mobile images.
- `src/components/storefront/CatalogSections.tsx`: server-rendered category tiles and reusable ProductDto cards, distinct empty/unavailable sections. Compare price is tied to the displayed variant. Missing images use the existing local brand fallback.
- `src/data/storefront.ts`: replaceable typed campaign slides, category visual overrides and service copy.
- `src/app/page.tsx`: concurrent server-side HTTP catalog reads, published featured products selected by isFeatured, up to eight. No fabricated sample products on the actual homepage.
- `src/components/native/Footer.tsx`: backend Shop links, valid account/contact/about/blog/legal links and existing social URLs. FAQ currently contains placeholder copy, so is deliberately omitted, along with nonexistent shipping/cookie pages.
- `src/components/native/NewsletterSection.tsx`: visibly disabled email field/button; no submission handler, endpoint or anonymous subscription promise.
- `src/app/layout.tsx`, `globals.css`, `tailwind.config.js`: warm neutral tokens, available local Inter variable font, system serif for editorial headings, visible focus styles, normal-flow shell. The former Yekan font was mislabeled Playfair; no fonts were downloaded. Removed unused nav-pill/nav-icon CSS. Existing account styling and legacy color tokens remain.
- `/products?q=...` performs a simple case-insensitive match over title, short description and category names on the existing HTTP response. No new search backend or index.

## Preserved behavior

Auth.js, cart storage/mutations, wishlist, checkout, orders, profile, PayPal and transactional Prisma were not changed. Header actions link to existing routes. Cards link to the existing product detail actions: direct quick-add is intentionally deferred because products require variant selection; the current wishlist button also performs a separate request per instance. No new action architecture was introduced. HTTP contracts and backend publication semantics remain unchanged.

## Homepage campaign image inventory

The single campaign configuration is `src/data/storefront.ts`. All seven assets use local `/images/home/` paths with Italian alt text and Next Image fill/sizes behavior:

| Asset | Placement | Object position |
| --- | --- | --- |
| hero_borse.png | Borse hero | 85% center |
| hero_bambole.png | Bambole hero | 80% center |
| hero_bambole_2.png | Handmade storytelling hero | 70% center |
| category_borse.png | Borse category tile | 85% center |
| category_bambole.png | Bambole category tile | 75% center |
| featured_borse.png | Borse editorial story | 85% center |
| featured_clutch.png | Clutch inspiration editorial story | 75% center |

Images use object-cover without stretching, with reserved dimensions. HTML hero text occupies its own column on desktop and sits above images on mobile. The Borse category PNG bypasses runtime image optimization because its mobile WebP conversion stalls in this environment. It retains Next Image fill/sizes and lazy loading, serving the original 2.4 MB local asset. All other campaign assets retain optimization.

Category titles and links come from catalog category DTOs; missing campaign categories fall back to `/products` for hero/editorial links. Category tiles only render returned categories. Clutch links to Borse, or `/products` when Borse is unavailable. Featured product cards remain catalog data, separate from editorial images. All seven campaign images are used when Borse and Bambole are available.

The prior campaign references to `/products/borse/borsa1.jpeg`, `/products/borse/borsa.jpeg`, and `/products/bambole/bambola.jpeg` were replaced. Removed the verified-unimported `homepageEditorialContent` configuration containing obsolete homepage hero/carousel images. Retained shared editorial types/footer and `src/data/homepage.ts`, which is imported by the products page. No unrelated public assets or Cloudinary product images were deleted.

## Verification

Homepage image integration: `npm test` passes 26 tests across 6 files; `npm run lint` passes without warnings; `npm run typecheck` passes with `strict: true`. Production build passes. All seven assets return HTTP 200 and load at all four viewport sizes without horizontal overflow. Production and browser results are recorded in `.home-build.log` and `.home-responsive.log`.

Responsive checks use widths 1440, 1200, 820, and 390px, cover all three hero slides, category tiles and editorial cards, and check local asset HTTP responses. Browser catalog data comes from a local fixture HTTP server, not the live catalog. Preview database URLs point to an unreachable localhost port. No database commands, live mutations, backend edits, or sibling-repository changes were made for this task.
