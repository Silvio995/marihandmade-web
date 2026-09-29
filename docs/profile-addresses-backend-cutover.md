# Profile and Addresses backend cutover

Implemented in Web on `feat/profile-addresses-backend`. Contract verified against
backend branch `feat/profile-addresses-api`, its routes/contracts/Prisma adapters,
and `docs/profile-addresses-api.md`. Deploy that backend implementation first; do
not assume backend main already contains it. Backend was inspected read-only.

## Request flow and forwarding

Previously seven Web call sites read/wrote User profile or Address through Prisma.
Now browser requests go to same-origin Next.js routes, which forward to Fastify;
Fastify authenticates the session and performs persistence. Server-rendered pages
read Fastify directly through the server-only client with the incoming cookie.
`MARIHANDMADE_API_URL` stays server-only.

| Web route                                    | Backend route                                                        | Success                          |
| -------------------------------------------- | -------------------------------------------------------------------- | -------------------------------- |
| GET/PATCH `/api/profile`                     | GET/PATCH `/api/profile`                                             | 200 bare Profile                 |
| GET/POST `/api/addresses`                    | GET/POST `/api/addresses`                                            | 200 bare array/Address           |
| GET/PATCH/DELETE `/api/addresses/:addressId` | same                                                                 | 200 Address; DELETE 204          |
| POST `/api/profile/update`                   | PATCH `/api/profile`                                                 | 200 Profile; compatibility alias |
| GET `/api/profile/summary`                   | Auth `/me`, Profile, Addresses plus transitional cart/wishlist reads | 200 compatibility aggregate      |

The pure forwarding routes preserve backend status, body, content type, and
Set-Cookie. All private responses (including errors) use `Cache-Control: no-store`
and `Vary: Cookie`. Cookies, original Origin, content type and body are forwarded;
query strings and arbitrary identity headers are not. IDs are encoded as path
segments. Writes reuse Auth's exact trusted-Origin check, including its configured
production public origin. No trusted Origin is synthesized. Body reads are bounded
at 4096 bytes for Profile and 16384 for Addresses. HTTP clients use no-store,
eight-second timeouts and reject redirects. The legacy alias retains PATCH's
validation and omission semantics, not the former `{status: 'ok'}` response.

## DTOs and editing

Profile has required nullable string fields `name`, `phone`, `email`, `birthday`.
Only `name?: string | null` and `phone?: string | null` can be patched. The browser
client explicitly picks these keys, retaining omitted versus null/blank values.
Backend normalization clears null/blank, preserves omitted fields, resets phone
verification only when the normalized phone changes, and rejects unknown fields.
Email, birthday, password and security editing are not introduced. Successful
profile edits refresh both Auth `/me` state and the compatibility aggregate.

Address has string `id`, `country`, `address`, `city`, `phone`, `postalCode`,
`createdAt` (ISO timestamp). Create requires the four address/contact fields;
country can be omitted (backend defaults to `IRI`). PATCH is partial. There is no
owner or default-address field. The list retains backend ordering
`createdAt DESC, id DESC`; updates preserve existing IDs and creation timestamps.

`client-profile-addresses.ts` centralizes same-origin browser requests, allowlists
write fields, checks status, validates read DTOs and throws typed safe errors.
`api/profile-addresses.ts` is the server-only transport;
`server-profile-addresses.ts` handles authenticated page reads.

## Authentication, ownership and failures

Backend session authentication is the sole authority. Forwarding does not derive
ownership from URL, body, query, client state or localStorage. Backend scopes
address detail/update/delete by address ID and authenticated user ID. Missing and
foreign addresses share the same 404. Existing HttpOnly cookies, Auth provider,
login/signup/logout, and same-origin Auth forwarding remain in use; no NextAuth.

Clients map 401 to a sign-in message, 403 to forbidden, 400/413/414/415 to validation,
404 to unavailable record, 409 to conflict, and network/malformed/server failures
to temporary unavailability. Raw backend/database text never becomes UI text.
Server reads redirect on 401 and call `notFound()` on 404; other failures reach the
safe Profile error boundary with retry. Forms retain input, restore controls and
never claim success or navigate after a failed write. Failed deletion retains the
row. The User provider exposes an error/retry state and preserves existing data
for the same account on failure; stale responses cannot overwrite another account.

## Compatibility and fixed Web bugs

The backend Profile DTO deliberately does **not** include cart/wishlist relations.
`/api/profile` now mirrors that DTO; the existing User provider instead reads
`/api/profile/summary`, which composes backend Profile/Addresses with
`readAccountAggregates`. That helper reads Cart and Product's wishlist membership,
using only the identity returned by backend `/me`. It does not read User profile
or Address. Missing cart remains `null`; cart items still include their products;
wishlist remains an array. These two domain reads are explicitly transitional.

Checkout only changes its address consumer: the typed client returns the bare
array, selects the first/newest ID, and passes that unchanged ID to existing order
creation. Loading/errors are visible, failures block checkout with retry, and
obsolete requests are ignored on identity changes. Successful empty arrays retain
the existing optional-address behavior. Guest checkout and all order/payment
operations remain in Web.

Fixed missing list/delete handlers, edit-as-create, singular delete URL, wrong
delete redirect, missing JSON headers/status checks, unsafe error text, accidental
omitted-profile-field clearing, and invisible checkout address failures. Added an
Edit link to the active list and an accessible detail-delete button label.

## Prisma removal and remaining inventory

All seven audited persistence accesses were removed:

- `src/app/api/profile/route.ts`: User profile and addresses/cart/wishlist aggregate read.
- `src/app/api/profile/update/route.ts`: User profile update.
- `src/app/(store)/(routes)/profile/edit/page.tsx`: User scalar read.
- `src/app/api/addresses/route.ts`: Address create.
- `src/app/api/addresses/[addressId]/route.tsx`: Address detail read.
- `src/app/(store)/(routes)/profile/addresses/page.tsx`: Address list read.
- `src/app/(store)/(routes)/profile/addresses/[addressId]/page.tsx`: Address detail read.

Remaining executable direct User/Address delegate calls, all **A: intentionally
outside this milestone**:

| File                                                       | Remaining operations                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/app/api/wishlist/route.ts`                            | User findUniqueOrThrow; two updates (wishlist connect/disconnect)         |
| `src/app/api/subscription/email/route.ts`                  | Two User updates (subscribe/unsubscribe and email readback)               |
| `src/app/api/subscription/phone/route.ts`                  | Two User updates (subscribe/unsubscribe and phone readback)               |
| `src/app/api/auth/reset/request/route.ts`                  | User findUnique for reset                                                 |
| `src/app/api/auth/reset/confirm/route.ts`                  | User findUnique and update for password reset                             |
| `src/app/api/auth/verify/request/route.ts`                 | User findUnique for verification                                          |
| `src/app/api/auth/verify/confirm/route.ts`                 | User update for verification                                              |
| `src/lib/auth-request-throttle.ts`                         | User findUnique and update for OTP send throttle                          |
| `src/app/api/orders/route.ts`                              | Address findFirst with id + backend userId for order ownership validation |
| `src/app/api/orders/[orderId]/pay/paypal/capture/route.ts` | User findUnique selecting customer email                                  |

Remaining relation accesses, also **A**:

- `src/app/api/cart/route.ts`: Cart's nested User connect.
- `src/app/api/orders/route.ts`: Order address include/connect, User connect,
  cart's related User email selection.
- `src/app/api/orders/[orderId]/route.tsx`: Order address and full User includes.
- `src/app/(store)/(routes)/profile/orders/[orderId]/page.tsx`: Order address include.
- `src/lib/transitional-account-aggregates.ts`: Product wishlist User membership
  predicate and Cart userId predicate; no User delegate/profile read.

**B: test-only:** mocked User/Address delegates and assertions in
`tests/auth-ownership.test.tsx`, `tests/profile-addresses-summary.test.ts`, and
mock delegates in `tests/auth-payments.test.ts`. These never access a database.

**A: retained generated infrastructure:** `src/generated/client/` contains generated User/Address
schema, delegates, relation types and documentation examples. This is the retained
Prisma client used by transitional domains, not another active Profile/Address
implementation. **C: dead/legacy code:** the unused address table has a `postal` presentation field;
it has no Prisma access and is not used by the current list.

**D: unexpected active Profile/Address access:** none. No raw User/Address SQL found.
The existing PayPal raw inventory SQL is outside this milestone.

## Deferred work and rollout checks

Cart, Wishlist, Checkout, Orders, Payments/PayPal, Reviews, Newsletter,
subscriptions and legacy verification/password-reset persistence are not migrated.
Prisma remains installed; schema/migrations are unchanged.

Known separate security issue: `src/app/api/orders/[orderId]/route.tsx` serializes
its unfiltered included User, potentially exposing password/OTP fields to the
account owner. Fix via an explicit Order DTO during the Checkout/Orders milestone.
This cutover neither uses nor expands that serialization. Backend address edits
still affect shared order-address rows; order snapshots/history remain future work.

After deploying the backend branch, smoke-test with an isolated test database:
login/logout; profile name/phone clear and omission; changed/unchanged phone
verification; existing cart/wishlist; address list/create/detail/edit/delete;
foreign/missing 404; order-linked deletion 409; expired sessions; backend outage
and retry; checkout's newest-address selection; guest checkout/PayPal. Do not use
real customer records for mutation testing.

Validation uses mocked fetch/Prisma only. No database migrations, schema changes,
seeds, live profile/address requests, production database access or mutations,
commits, pushes, or backend modifications are part of this work.

## Validation results

- `npm test -- --maxWorkers=2 --minWorkers=1`: 220 tests passed in 16 files.
  Includes Auth/session/ownership, Catalog, providers, cart/wishlist, checkout,
  payments/PayPal, forwarding/client/SSR/form and aggregate regressions.
- `npm run typecheck`: passed.
- `npm run lint`: passed, no warnings or errors.
- `npm run build`: passed; database/backend URLs explicitly overridden to unused
  loopback endpoints. Existing Browserslist data-age notice only.
- Installed Prettier `--check` on all changed TS/TSX/Markdown files: passed.
  No repository-wide formatting script is configured.
- `git diff --check`: passed.
- Backend working tree remains clean. Prisma schema/migrations and dependencies
  unchanged. No production database access or mutation occurred.

## Exact changed files

- `docs/profile-addresses-backend-cutover.md`
- `src/app/(store)/(routes)/profile/addresses/[addressId]/components/address-form.tsx`
- `src/app/(store)/(routes)/profile/addresses/[addressId]/page.tsx`
- `src/app/(store)/(routes)/profile/addresses/components/addresses-client.tsx`
- `src/app/(store)/(routes)/profile/addresses/page.tsx`
- `src/app/(store)/(routes)/profile/edit/components/server-profile-form.tsx`
- `src/app/(store)/(routes)/profile/edit/page.tsx`
- `src/app/(store)/(routes)/profile/error.tsx`
- `src/app/(store)/checkout/page.tsx`
- `src/app/api/addresses/[addressId]/route.tsx`
- `src/app/api/addresses/route.ts`
- `src/app/api/profile/route.ts`
- `src/app/api/profile/summary/route.ts`
- `src/app/api/profile/update/route.ts`
- `src/lib/api/profile-addresses.ts`
- `src/lib/auth-forwarding.ts`
- `src/lib/client-profile-addresses.ts`
- `src/lib/profile-addresses-contracts.ts`
- `src/lib/profile-addresses-forwarding.ts`
- `src/lib/server-profile-addresses.ts`
- `src/lib/transitional-account-aggregates.ts`
- `src/state/User.tsx`
- `tests/auth-checkout.test.tsx`
- `tests/auth-client.test.tsx`
- `tests/auth-ownership.test.tsx`
- `tests/profile-addresses-pages.test.tsx`
- `tests/profile-addresses-summary.test.ts`
- `tests/profile-addresses-ui.test.tsx`
- `tests/profile-addresses.test.ts`
