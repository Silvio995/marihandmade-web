# Wishlist Backend cutover

Authenticated Wishlist persistence is owned exclusively by marihandmade-backend.
Web has no Wishlist Prisma operations. The existing implicit User/Product relation
is retained: no schema/migration changes or production data rewrite are required.

## Production readiness

The user completed a manual read-only production audit before authorizing this
implementation. public."\_Wishlist" has non-null TEXT A (Product) and B (User),
validated cascading foreign keys, a valid/ready unique (A,B) index and B index.
The audit reported zero relationships, duplicates, nulls and orphans. These are
user-provided verification results; implementation did not access production.

## HTTP contract

Browser requests remain same-origin:

- GET /api/wishlist → 200 `{ items: WishlistItemDto[] }`.
- POST /api/wishlist with strict JSON `{ productId }` → 200
  `{ productId, present: true }`, including duplicate saves.
- DELETE /api/wishlist/:productId with no body → 204, including absent/deleted
  products and repeated removal.

Product IDs are canonical IDs (not slugs), nonempty, at most 100 characters and
without surrounding whitespace. Ownership/variant fields and query parameters
are rejected. Backend ownership derives only from request.authIdentity.user.id.
POST requires JSON. Mutations require the actual trusted browser Origin.
Forwarders preserve session cookies, Origin, statuses and Set-Cookie, use fixed
Backend URLs, eight-second timeout, no-store and redirect:error. They never
synthesize a trusted Origin or forward caller ownership. Successful responses are
validated/allowlisted again in Web. Private responses/errors use no-store and
Vary:Cookie. Unreachable or invalid Backend responses become safe 503 errors.

## Publication and DTOs

Public items contain `{ productId, visibility: "PUBLIC", product: ProductDto }`,
using the existing Catalog contract. Unpublished saved products contain only
`{ productId, visibility: "UNAVAILABLE", product: null }`. No unpublished title,
pricing, images, description or metadata is exposed. Membership is retained so
it can be removed and restored to normal presentation if republished.

Public eligibility uses Backend's existing Catalog predicate, independent of
purchase eligibility. Zero quantity, missing inventory or unpurchasable variants
do not prevent a save. ACTIVE products need not have isAvailable=true. Wishlist
stores Product identity only and never reserves/decrements inventory or changes
Cart. Product/User deletion cascades membership cleanup. Ordering is by Product
ID, with no invented save timestamp.

## Web state and UI

WishlistProvider owns identity-scoped membership/items, read loading/errors and
per-product pending mutations. Consumers share an initial read. State clears on
logout/account switch; generation/lifetime checks discard obsolete responses,
including an account switch away and back. Successful actions update confirmed
membership and reconcile against Backend GET. Failed/lost responses also
reconcile; the action failure stays visible with retry. Same-product pending
actions are deduplicated. Focus/visibility refresh and BroadcastChannel
invalidation synchronize tabs without persisting Wishlist data.

The Wishlist page no longer depends on Profile/Addresses/Cart summary success.
It distinguishes loading, empty, failure and unavailable saved products. The
product-detail action and active native/editorial, retail and homepage cards use
the same membership state. Card buttons are siblings of navigation links, never
nested interactive controls. Storefront presentation, price/variant selection
and Cart actions are preserved.

Profile summary reads Backend Wishlist and preserves `wishlist: ProductDto[]`
using PUBLIC entries only. UNAVAILABLE entries are shown only by the dedicated
Wishlist experience. The unused transitional aggregate helper was removed.
Cart summary compatibility is unchanged.

There is no guest Wishlist, guest merge, local persistence, toggle API or mutation
receipt system. Auth/session architecture is reused unchanged. Catalog API,
Profile/Addresses APIs, authenticated/guest Cart, Checkout, Orders, Payments,
PayPal, inventory behavior and Admin remain outside this change. Web Prisma
remains for later domains.

## Validation and rollout boundary

Tests cover forwarding/validation, shared card/detail/page actions, empty vs
failure, unavailable removal, identity/stale responses, focus/cross-tab refresh,
summary sourcing and a source guard against Web Wishlist Prisma persistence.
Existing Auth/Profile/Addresses/Cart and commerce regressions remain in the full
suite. Production builds use database and Backend URLs forced to unreachable
loopback endpoints. Backend database tests use a disposable loopback cluster and
explicit fixture DDL, never production, db-push or archival migrations.

Rollout is not performed by this implementation. When separately authorized,
make Backend Wishlist capability available before switching Web. No database
migration is a prerequisite. Avoid rolling back only Backend while Web depends
on its Wishlist API. Runtime database-role access remains an operational setting;
no grants/RLS/history reconciliation is performed here.

Final production Cart E2E smoke remains intentionally deferred because current
production quantityOnHand is zero. Do not adjust inventory to enable that smoke.
No deployment, merge, commit/push or production data modification was performed.

## Completed validation

Web full suite: 298 tests passed across 22 files. Typecheck, lint (no warnings),
production build, changed-file formatting checks and git diff --check passed.
Build database/Backend URLs pointed only at unreachable loopback endpoints.
A complete source search excluding generated code, plus a regression source
check, found no remaining authenticated Wishlist Prisma read/write. Generated
Prisma files and excluded domain implementations have no diff. Backend passed
323 full-suite tests plus seven separately run disposable PostgreSQL Wishlist
tests; its typecheck/build/format/diff checks passed.
