# MariHandmade Web

Standalone Next.js 14.2.15 customer application. Public catalog reads use the separate MariHandmade backend over HTTP. Other server domains remain transitional.

Current milestone: [real-data rendering report and grouped Prisma inventory](docs/real-data-rendering.md). Catalog rendering fixes pass isolated validation; live verification awaits the local backend on port 3001.

## Setup

Use Node.js 22 on Debian/OpenSSL 3 Linux (the Dockerfile provides this environment).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Set `MARIHANDMADE_API_URL` to the backend origin, without `/api` (use the actual backend port). This is server-only. Catalog requests have an 8-second timeout, no persistent cache, and runtime DTO validation. No backend or database is required to install or build. Customer account/payment features still require their existing runtime credentials; fill placeholders privately. Never commit environment files.

```sh
npm test
npm run typecheck
npm run build
npm start
```

Docker builds from this repository root. Vercel also uses this root and `npm run build`; no monorepo root or shared packages are needed. Docker has been adapted but not executed in this milestone.

## Catalog boundary

`src/lib/api/contracts.ts` mirrors backend DTOs, with publishedAt validated as an ISO wire string. Update it alongside backend contract changes. `catalog.ts` handles products, product-by-ID/slug, categories and brands. Pages, public product API proxies, action helpers, featured products and product sitemap entries use this boundary. There is no database fallback.

The backend currently returns complete arrays without pagination, sorting, updatedAt, or order counts. Web filters these arrays and retains client sorting; the former silent 12-item truncation is removed. Featured sorting uses isFeatured, not sales counts. The default sort is labeled catalog order because recency is not guaranteed. This is suitable for the current catalog; backend pagination is future work. Product sitemap entries omit unsupported modification dates; blog entries retain database dates.

Backend failures produce a retryable page boundary or API 503, distinct from product/category 404. Empty catalogs have an explicit empty state. Header failure falls back to general navigation; homepage shows category unavailability separately from an empty category list. Homepage collections and desktop/mobile category links derive from category DTOs. Costumi/Filati hardcoded collection links and the Kit e Filati footer link were removed. Editorial photos and custom-order copy remain.

## Presentation foundation

Existing styling, UI library and responsive catalog components remain. Header accepts category props; shared product presentation contracts live in `src/types/product.ts`, independent of generated types, while catalog pages consume explicit DTOs. Shared cards also accept transitional wishlist/cart product shapes. Mobile navigation exposes expanded state and hides closed links from keyboard navigation. Homepage collection labels remain visible on touch devices. Removed the nested root main landmark and unused curated category data. Multiple legacy card implementations and duplicated style values remain redesign debt.

## Transitional database debt

No external monorepo package dependencies remain. The already-copied `src/generated/client` is a frozen Prisma 5.22 runtime used only by unmigrated domains. Its schema was not changed. Build/install do not generate Prisma or execute database commands. Local engine resolution replaces its embedded historical generation path. Bundled engines support Debian/OpenSSL 3 and RHEL/OpenSSL 3; use Docker on other platforms, or explicitly provide a compatible `PRISMA_QUERY_ENGINE_LIBRARY`. This frozen runtime is temporary and should be removed when remaining backend domains migrate. Historical paths inside generated metadata are inert, not install/build dependencies.

Remaining domains: Auth.js adapter and credentials, signup/reset/verification/throttling; account/profile/addresses/subscriptions; cart and wishlist; checkout/order pricing and publication validation; orders and PayPal transactions/webhooks; reviews and review product validation; blog and blog sitemap; legacy banner/home-visual helpers. Transactional product reads deliberately stay local for consistency. They are not public catalog list/detail reads. Account, cart, wishlist, checkout, order, payment and review behavior was preserved, not live-tested against production.

Every remaining direct Prisma/generated-client import is listed below (generated runtime internals excluded):

- `src/actions/get-banners.ts`
- `src/actions/get-home-visuals.ts`
- `src/app/(store)/(routes)/blog/[slug]/page.tsx`
- `src/app/(store)/(routes)/blog/page.tsx`
- `src/app/(store)/(routes)/profile/addresses/[addressId]/page.tsx`
- `src/app/(store)/(routes)/profile/addresses/page.tsx`
- `src/app/(store)/(routes)/profile/edit/page.tsx`
- `src/app/(store)/(routes)/profile/orders/[orderId]/page.tsx`
- `src/app/(store)/(routes)/profile/orders/page.tsx`
- `src/app/api/addresses/[addressId]/route.tsx`
- `src/app/api/addresses/route.ts`
- `src/app/api/auth/reset/confirm/route.ts`
- `src/app/api/auth/reset/request/route.ts`
- `src/app/api/auth/signup/route.ts`
- `src/app/api/auth/verify/confirm/route.ts`
- `src/app/api/auth/verify/request/route.ts`
- `src/app/api/cart/route.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/orders/[orderId]/pay/paypal/capture/route.ts`
- `src/app/api/orders/[orderId]/pay/paypal/route.ts`
- `src/app/api/orders/[orderId]/pay/paypal/sync/route.ts`
- `src/app/api/orders/[orderId]/pay/route.ts`
- `src/app/api/orders/[orderId]/route.tsx`
- `src/app/api/orders/route.ts`
- `src/app/api/paypal/webhook/route.ts`
- `src/app/api/products/[productId]/reviews/route.ts`
- `src/app/api/profile/route.ts`
- `src/app/api/profile/update/route.ts`
- `src/app/api/subscription/email/route.ts`
- `src/app/api/subscription/phone/route.ts`
- `src/app/api/wishlist/route.ts`
- `src/app/sitemap.ts`
- `src/lib/auth-request-throttle.ts`
- `src/lib/auth.ts`
- `src/lib/paypal.ts`
- `src/lib/prisma.ts`
- `src/lib/public-products.ts`

`src/lib/public-products.ts` retains Prisma predicates exclusively for transactional/review validation. `src/types/prisma.ts` contains handwritten transitional account DTOs, not generated imports. `@next-auth/prisma-adapter`, `@prisma/client`, and the pinned Prisma tooling remain local registry dependencies, not monorepo links.

## Previous separation milestone validation and safety

Final results: clean `npm ci` passed; 5 test files / 17 tests passed; strict `tsc --noEmit` passed; Next.js production build passed, including lint and type validation, with no Prisma initialization errors. No live database connection or customer/payment transaction was exercised.

Commands executed: read-only `rg`, `find`, `cat`, `diff`, `git status`; local Python editing scripts; `npm install --no-audit --no-fund`; `npm ci --no-audit --no-fund`; `npm test`; `npm run typecheck`; `npm run build`. Final build used process-only database/backend overrides targeting unreachable localhost port 1. Initial build loaded existing `.env.local` automatically but stopped during type checking before page collection. No environment file was read, copied, printed or modified by the agent.

No Prisma CLI/database commands, migrations, schema edits, seeds, deployments, production API calls, or intentional database connections were made. Validation uses mocked HTTP and no production database. Reference repositories were inspected only. Test infrastructure repairs include JSX setup extension, automatic JSX transform, hoisted mocks, and replacing stale retired OTP/middleware assertions with current-behavior tests.

## Visual storefront milestone

See [layout implementation and validation](docs/storefront-layout.md) for the new shell/homepage, temporary campaign configuration, screenshots, and current design debt. This supersedes the earlier presentation-foundation description above.
