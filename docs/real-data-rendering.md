# Real data rendering milestone — 2026-09-11

Implementation and isolated validation are complete. **Live integration remains unverified because the local backend is not running.** No real DB product or live Cloudinary asset was visually confirmed in this milestone.

## 1. Catalog routes and HTTP boundary

The initial audit found that the homepage, product listing, category pages, product detail, header/footer categories, public product API proxies and product sitemap entries already used `src/lib/api/catalog.ts`. That working migration was preserved rather than repeated.

| Surface | Authoritative source |
| --- | --- |
| `/` featured products | `GET /api/products`, then `isFeatured`, maximum eight |
| `/` category tiles and campaign links | `GET /api/categories`; local campaign assets remain unchanged |
| `/products` and search | `GET /api/products`; server-side query filtering, existing client sorting/availability toggle |
| `/catalog` | Existing redirect to `/products` |
| `/categories/[slug]` | Resolve the slug from `GET /api/categories`, filter HTTP products by category ID |
| `/products/[productId]` | `GET /api/products/:identifier`; backend resolves ID or slug |
| Header/footer navigation | `GET /api/categories` |
| Web `/api/products` and `/api/products/[productId]` | Existing HTTP proxies; unavailable backend returns 503 |
| Product sitemap entries | HTTP products; blog sitemap entries still use transitional Prisma |
| Brands | Existing `GET /api/brands` client and nested product DTO brand; no prominent brand UI |

Backend contracts were inspected read-only in `../marihandmade-backend/src/modules/catalog/{contracts,catalog,publication}.ts`. Frontend contracts match the HTTP wire shape, including ISO-string `publishedAt`. Backend publication rules remain authoritative: no new frontend status/publication filtering was added. Public ACTIVE sold-out products remain visible.

The existing server-only `MARIHANDMADE_API_URL` was missing from `.env.local`; it is now set to `http://localhost:3001`, matching both `.env.example` and the backend default. No duplicate configuration variable was introduced. Environment credentials are not included in this report.

## 2. Fixture and legacy runtime paths

No runtime product/category fixture fallback existed in the audited catalog routes. There was therefore no fake-product fallback to remove. Tests continue to use HTTP DTO fixtures; `.home-preview.cjs` and the new `.real-data-browser-check.cjs` are explicitly isolated local validation utilities, never imported by application code.

The catalog banner no longer imports the old sample image collection from `src/data/homepage.ts`; it uses the existing centralized local campaign hero image. Catalog product cards never use campaign images as product substitutes.

Product detail no longer mounts `ProductReviews`, which automatically called the legacy Prisma-backed reviews endpoint. Reviews require a future backend HTTP contract. The reviews endpoint and mutation implementation remain unchanged, but are not a dependency of current catalog rendering.

## 3. Product images

`getProductGallery` and `getPrimaryImageUrl` share the same selection:

1. Usable `productImages` covers first, then ascending `position`.
2. Remaining usable `productImages`, also ordered by position.
3. Legacy `images` only when no usable `productImages` remain.
4. `/images/product-placeholder.svg`, a neutral local placeholder.

Unsupported remote hosts, malformed URLs and protocol-relative URLs are rejected. A malformed cover does not mask a later valid gallery image. Local URLs and HTTPS Cloudinary URLs retain Next Image support; existing Cloudinary configuration is unchanged. No catalog product URLs were hardcoded. Image alt text and gallery ordering come from DTO data. Remote HTTP failures at an otherwise valid Cloudinary URL were not exercised without the live backend.

## 4. Prices

All catalog card implementations and product detail use the shared Italian EUR formatter: `39,00 €` (Intl uses a non-breaking space). Cards retain the existing minimum-variant-price rule, falling back to top-level price without variants. Detail displays the selected variant price.

Compare-at is displayed only when it exceeds the displayed price and belongs to the variant supplying that price. The previous cross-variant sale comparison is fixed. Top-level `discount` remains in the DTO; no new discount calculation, stacking rule, percentage interpretation or checkout pricing change was introduced.

## 5. Categories

Header, footer, homepage tiles and category pages remain DTO-driven. Category pages match slugs and filter products by category ID; they do not assume Borse/Bambole names. Future categories can appear without new hardcoded navigation. Valid empty categories render an empty state, unknown categories use `notFound`, and backend failures reach the friendly error boundary. No hierarchy or category records were created.

The collection count now uses correct singular/plural Italian and reflects the current availability filter. The existing default sort option now matches its state value.

## 6. Featured products

The homepage keeps the backend `isFeatured` filter and existing eight-item limit. The legacy featured helper now follows that same rule instead of additionally excluding `isAvailable=false` products. An empty featured list shows the existing empty state; backend failure shows unavailability. No substitute product list exists.

## 7. Product details, availability and variants

Detail renders the HTTP title, short/full descriptions, ordered gallery, linked categories, prices, actual options, selected variant information, selected bundle components, and the existing cart component. Prominent brand labels were removed from catalog cards and detail so seed branding is not promoted; brand remains available in contracts and the existing query filter.

Raw inventory counts, SKU/debug-like labels and unsupported rapid-shipping promises were removed from the edited catalog presentation. `getAvailabilityLabel` uses existing purchase-eligibility helpers, including reserved inventory, tracking/backorder rules and legacy availability/stock. It shows `Esaurito` when not purchasable, `Su ordinazione` for purchasable made-to-order products or exhausted stock with backordering, otherwise `Disponibile`. Missing inventory does not invent availability. Underlying eligibility and transactional rules are unchanged.

Existing option-based selection remains. Empty option definitions are not rendered. Products with variants but no options now have a simple title/price selector, initialized from the existing preferred-variant helper. It updates selected price and passes the selected ID into the unchanged cart component. Empty variants fall back to legacy price/availability without crashing. Cart/wishlist implementations and header wishlist UI were not rewritten or migrated.

## 8. Null slugs

Cards and sitemap links preserve `slug ?? id`, encoded as a route segment. The product page sends that identifier to the backend and uses its lookup result. ID-only products are covered by route and browser fixture tests. No slug is invented or written to the database.

## 9. Error and empty states

The existing HTTP client validates all responses and turns timeout, connection, non-2xx and malformed DTO failures into a sanitized catalog error. Only a backend product 404 returns null and triggers `notFound`. Unknown categories similarly use `notFound`; unavailable category requests do not become false 404s.

Homepage sections distinguish unavailable data from empty lists. Listing/detail failures reach the existing retryable error boundary; empty listings have an explicit empty state. Browser failure checks confirm no fake products or backend error details appear. Missing descriptions now use a neutral missing-description message instead of fabricated product-specific copy.

## 10. SSR, search, SEO and caching

Pages retain server-side HTTP reads and the existing dynamic layout. No client-only catalog migration was introduced. Existing root metadata and sitemap behavior remain intact. Product sitemap links use HTTP data; blog sitemap generation still requires its legacy database domain.

Every catalog fetch retains `cache: 'no-store'` and an eight-second timeout. There is no persistent catalog cache, indefinite inventory cache, new revalidation interval or new cache infrastructure. The backend currently returns full arrays; search filters fetched titles, short descriptions and category titles on the server. Existing client sorting and availability filtering operate on those same DTOs. Pagination/backend search remain future work; no results are fabricated.

## 11. Remaining direct Prisma inventory

Catalog page/list/detail rendering has no direct Prisma dependency. The new tests deliberately reject a Prisma-client import from these paths. Remaining uses are transitional and were not changed:

| Domain | Runtime database usage |
| --- | --- |
| Auth | `src/lib/auth.ts` (adapter, credentials); `src/lib/auth-request-throttle.ts`; `src/app/api/auth/signup/route.ts`; reset request/confirm and verify request/confirm under `src/app/api/auth/` |
| Cart | `src/app/api/cart/route.ts` (cart/product-variant reads and mutations) |
| Wishlist | `src/app/api/wishlist/route.ts` (user wishlist relations and mutations) |
| Checkout | `src/app/api/checkout/route.ts` (cart/products and transactional validation) |
| Orders | `src/app/api/orders/route.ts`; `src/app/api/orders/[orderId]/route.tsx`; `src/app/(store)/(routes)/profile/orders/page.tsx`; `src/app/(store)/(routes)/profile/orders/[orderId]/page.tsx` |
| Payments | `src/app/api/orders/[orderId]/pay/route.ts`; PayPal route/capture/sync under that directory; `src/app/api/paypal/webhook/route.ts`; `src/lib/paypal.ts` accepts an injected Prisma client for transactions |
| Profile | `src/app/api/profile/route.ts`, `profile/update/route.ts`; `src/app/api/addresses/route.ts`, `addresses/[addressId]/route.tsx`; profile edit and both address pages under `src/app/(store)/(routes)/profile/`; email/phone subscription routes |
| Other: reviews | `src/app/api/products/[productId]/reviews/route.ts` still reads reviews and validates products locally, and retains review submission. It is no longer mounted from product detail. |
| Other: content | Blog list/detail pages under `src/app/(store)/(routes)/blog/`; `src/app/sitemap.ts` for blogs only; unused `src/actions/get-banners.ts` and `src/actions/get-home-visuals.ts` |
| Other: infrastructure | `src/lib/prisma.ts` creates the frozen client; `src/lib/public-products.ts` retains Prisma predicate types for transactional/review validation; `src/generated/client/` remains unchanged |

Type-only transitional account/cart/order usages are not catalog database reads: `src/state/{Cart,User}.tsx`, `src/lib/{cart,email}.ts`, checkout page, cart item component, product cart button, profile order/address form components. `src/types/prisma.ts` is a handwritten transitional presentation type file. Shared catalog presentation types in `src/types/product.ts` do not import generated database types.

## 12. Validation results

- `npm test`: **49 tests across seven files passed** (23 new rendering tests).
- `npm run lint`: **passed, no warnings/errors**.
- `npm run typecheck -- --strict`: **passed**.
- `npm run build`: **passed** with database/backend process overrides pointing at unreachable localhost port 1.
- Homepage first-load JavaScript: **125 kB**, unchanged from the motion milestone.
- Product detail first-load JavaScript: **139 kB**, down from 143 kB after removing the reviews dependency.
- Isolated production browser checks at **1440px and 390px** passed for homepage, products, Borse/Bambole categories, positive-stock and zero-stock ID-only detail fixtures, search, missing product/category, and unavailable backend states.
- Visible fixture images loaded; no horizontal overflow or successful-route browser console/runtime errors. Mobile sold-out and desktop available detail screenshots were visually inspected.
- Homepage CSS, hero carousel, reveal system, marquee and campaign definitions were compared against the pre-edit snapshot and preserved.

Artifacts: `.real-data-tests.log`, `.real-data-lint.log`, `.real-data-types.log`, `.real-data-build.log`, `.real-data-browser-check.cjs`, `.real-data-browser.log`, `.real-data-*.jpg`. The browser utility creates local HTTP fixtures and a production preview only, then closes its servers. It does not connect to a database. Expected error-boundary failures appear in the server error log during deliberate outage checks. Existing NextAuth URL and optional Sharp warnings remain outside this milestone.

## 13–14. Live verification and real products

Repeated read-only `GET http://localhost:3001/api/health` attempts failed to connect. The backend source and environment example confirm 3001 as its default, and no local listener was present there. Backend code was not modified or started.

**Live integration: not verified. Real DB products visually confirmed: none.** In particular, Clutch Mini Rosa Antico, Birkin Mini Azzurra, Elsa and Bambola Lilo cannot be claimed as verified. Browser screenshots are explicitly labeled test DTO products; they are not evidence of real Cloudinary image delivery or real DB inventory. Once the backend is running at the configured origin, those read-only acceptance checks remain to be performed.

## 15–16. Scope and safety

No database mutation, seed, migration, Prisma CLI command, schema change or database command occurred. Neither `../marihandmade-backend` nor `../mariHandmade` was modified. No auth, cart, wishlist, checkout, order or payment mutation implementation changed. Generated Prisma files match the pre-edit snapshot.

Only catalog presentation, tests, a neutral image asset, documentation, isolated validation artifacts and the existing local catalog environment setting changed. No dependencies were added. The repository has no commits, so source changes were audited against a pre-edit snapshot rather than claiming a historical Git diff.
