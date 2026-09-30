# Cart Backend cutover

Implemented against Web HEAD `4fd4358ba73da48a3dc1cfd29374fab301bec002`
(`feat/profile-addresses-backend`) and the accepted current working-tree Cart audit.
Pre-existing Cart page/control/API edits and the untracked Cart regression suite
were present before this work. Their global-provider/inventory behavior was retained;
persistence assertions now exercise the Backend contract at the HTTP boundary.
Review against these branch HEADs, not main's earlier Auth/Profile implementation.
No commits or pushes were made.

The exact Backend contract is documented in the sibling repository's
`docs/cart-api.md`. Deploy its new migration and Backend before this Web cutover.

## Ownership and HTTP boundary

`/api/cart` now forwards GET/POST to Backend and contains no Prisma access.
Ownership comes only from Backend session authentication. The forwarding boundary
passes Cookie, original Origin, Content-Type, Idempotency-Key and the exact body;
no identity headers or query parameters are forwarded. POST checks trusted Origin
and bounds the body at 65,536 bytes. Backend validates the JSON contract and UUID.
Responses preserve status, body, content type and Set-Cookie, with no-store and
Vary: Cookie. The server-only transport uses MARIHANDMADE_API_URL, an eight-second
timeout, no caching and rejected redirects. Failures produce safe structured 503.

The browser validates CartDto at runtime, uses twelve-second timeouts and safe
errors, and never displays Backend/database error text. CartDto/product/variant
shapes mirror the explicit Backend Catalog allowlist. Exact persisted variant
identity is retained; hints and sole-variant inference are removed.

## Cart state and controls

The authenticated provider reads Backend Cart independently of User/profile data.
refreshCart fetches the authoritative cart, and profile refresh cannot restore an
older cart. Queued reads/writes, identity guards and request versions reject obsolete
responses. Failures preserve the last confirmed state and expose Retry cart.
Authenticated dispatchCart is ignored: confirmed Backend responses are the state source.
Guest dispatchCart still writes localStorage and updates the shared context.

Add/+ sends adjust +1; Minus sends adjust -1; the displayed X sends remove.
No unconditional absolute quantity mutation remains. UI styling/layout is retained;
unavailable products keep readable rows and removable quantities. Badge, rows and
controls consume the same global provider. Cart receipt estimates and currency/tax
presentation are not redesigned; Checkout/Orders still perform their own pricing.

Each authenticated intent gets a UUID and its normalized ordered payload, persisted
before sending under `mh-cart-operation-v1:<account>:<UUID>`. This is coordination
metadata, not an account Cart snapshot. Queued operations recover older uncertain
intents first, using exactly the original key/payload. Reload/remount also recovers
these intents. Same-origin storage lets another tab recover the same key safely.

Successful responses acknowledge metadata. Definitive rolled-back failures retire
the intent; uncertain/network/server/auth outcomes and exhausted concurrency retries retain it. Idempotency conflicts
retain metadata and block blind reinterpretation. No retry generates a fresh key.
Requests/responses must match the expected account before local acknowledgement.
Account changes do not expose the previous account's cart or recover its metadata.

## Guest ownership and login transfer

Guest cart stays in localStorage["Cart"], preserving the existing guest UI.
Preparation, request and acknowledgement use the cross-tab Web Lock
`mh-guest-cart-merge`. No unlocked automatic fallback exists.

Inside the lock, a transfer freezes the exact guest snapshot and persists target
account, UUID and positive-adjust payload under `mh-cart-transfer-v1`. All recovery
uses this metadata, including after uncertain responses or reload. Storage failure
prevents sending an unrecorded transfer. Another account cannot claim the transfer.

The whole snapshot is submitted atomically. Confirmed success clears only that
exact snapshot, then removes transfer metadata. Clearing precedes metadata removal
so a crash between acknowledgement steps can replay the original operation safely.
New guest activity after acknowledgement creates a new transfer identity. Guest
editing is blocked while a frozen transfer awaits recovery, preventing overlapping
snapshots from being imported under different IDs.

Without Web Locks, retain guest data, fetch authenticated Cart, and show a visible
transfer error. Inventory failures and uncertain responses also retain the snapshot
and transfer metadata for same-key retry. An immutable failed transfer is not silently
edited or discarded. A user must resolve its availability before it can succeed.

This does not solve every generic concurrent localStorage guest-edit race, nor
protect coordination metadata from manual browser-storage deletion. Older browser
tabs running the previous Cart implementation should be reloaded during rollout.

## Summary and Checkout boundary

The compatibility `/api/profile/summary` now composes Backend Cart with Backend
Profile/Addresses; only Wishlist still uses the transitional aggregate helper.
A never-created Backend Cart maps to summary cart:null for existing compatibility.
Cart state does not consume that summary snapshot.

Checkout's persisted-account-cart fallback reads Backend Cart with the session
cookie and validates account identity. Submitted lines still take precedence.
Checkout's public-product queries, independent inventory checks, pricing, dropped
line reporting and readiness checks are unchanged. Checkout is not migrated.

## Only intentional Web Cart persistence exception

Both remaining executable accesses are in `src/app/api/orders/route.ts`:

1. `prisma.cart.findUnique`: owner-scoped account-cart read and submitted-line comparison.
2. `tx.cartItem.deleteMany`: CartItem consumption inside the existing order-creation
   transaction alongside inventory updates.

These are temporary exceptions until Orders moves to Backend. Neither was changed.
Receipts are not removed by consumption, so retries cannot resurrect consumed items.
No HTTP clear endpoint or nontransactional order-time clearing was introduced.
Existing races between order creation and concurrent cart editing remain an Orders
integration concern; Cart API serialization does not claim to migrate that workflow.

Orders, Checkout authority, Payments/PayPal and Wishlist remain in Web. Prisma remains
installed and the Web generated client is unchanged. Auth/Profile/Addresses ownership
and their private HTTP contracts remain unchanged.

## Changed files

Web implementation:

- src/app/api/cart/route.ts
- src/lib/api/cart.ts
- src/lib/cart-contracts.ts
- src/lib/client-cart.ts
- src/lib/cart-transfer.ts
- src/lib/cart.ts
- src/state/Cart.tsx
- src/lib/transitional-account-aggregates.ts
- src/app/api/profile/summary/route.ts
- src/app/api/checkout/route.ts (account-cart fallback only)
- src/app/(store)/(routes)/cart/components/item.tsx
- src/app/(store)/(routes)/products/[productId]/components/cart_button.tsx

The existing Cart page's removal of its nested provider was present before this
milestone and remains unchanged by this task.

Web tests:

- tests/cart.fixture.ts
- tests/cart-backend.test.ts
- tests/cart-state.test.tsx
- tests/cart-transfer.test.ts
- tests/orders-cart-transition.test.ts
- tests/cart-provider-regression.test.tsx (pre-existing untracked suite adapted)
- tests/auth-client.test.tsx
- tests/auth-ownership.test.tsx
- tests/profile-addresses-summary.test.ts

Backend implementation and migration:

- src/modules/cart/contracts.ts
- src/modules/cart/repository.ts
- src/modules/cart/routes.ts
- src/modules/cart/prisma.ts
- src/app.ts
- src/server.ts
- src/modules/auth/private-routes.ts (Vary: Cookie on private errors as well)
- prisma/schema.prisma (receipt model/User relation and partial-index documentation)
- prisma/migrations/20270901000000_authenticated_cart/migration.sql
- package.json (isolated PostgreSQL test script; no dependency changes)
- scripts/test-cart-postgres.cjs
- tests/cart-fixtures.ts
- tests/cart.test.ts
- tests/cart-postgres.test.ts
- docs/cart-api.md

## Validation

Full Web suite: 272 passed. Full Backend offline suite: 289 passed, plus 9 separate
isolated PostgreSQL tests passed. Existing Auth/Profile/Addresses, Wishlist, Catalog,
Checkout and PayPal tests ran with the Cart suites. Orders-specific tests call the
unchanged route and verify transactional consumption, rollback and independent
variant repricing. Former Web Cart persistence-only assertions moved to Backend
coverage; the existing Cart UI/Checkout regression scenarios remain.

Typecheck passed in both repositories. Web lint passed without warnings/errors.
Both production builds passed. Backend format:check and extra script/document
checks passed; changed-Web-file Prettier check passed. Prisma schema validation
and git diff --check passed. Backend has no configured lint script.
Web builds override database/backend URLs with unused loopback endpoints.
The build reported only the existing Browserslist data-age notice. No live
HTTP customer requests, production reads/writes, production schema changes or
production migrations are part of this work.

## Rollout risks

The migration deliberately fails on duplicate logical lines and does no repair.
Actual deployment schema/index/role state was not inspected. Verify the authorized
migration baseline and role privileges at deployment. Partial indexes live in SQL;
do not regenerate them as ordinary nullable Prisma uniqueness.

Receipts intentionally grow with successful intents and survive Cart consumption.
No arbitrary expiry/cleanup service is introduced. Browser coordination storage must
remain available for reliable retry. Web Locks are required for automatic transfer.
There is no new guest Backend cart, userId request parameter, separate Cart ID,
Cart inventory reservation/decrement or product-stock fallback for variants.
