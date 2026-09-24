# Web backend-auth cutover

Implemented on `feat/backend-auth-integration`. Fastify is the sole authority for customer identity. No customer session/account migration is needed. This milestone changes neither Prisma schema nor migrations and does not move commerce persistence out of Web.

## Request flows and contracts

```text
Browser → same-origin Next /api/auth/{signup,login,logout,me}
        → server-only HTTP client → Fastify → session/User database

SSR / protected Next API → incoming cookies → Fastify GET /api/auth/me
                        → backend User.id → existing owner-scoped Web Prisma queries
```

The contract was inspected read-only in the sibling backend's `docs/auth-core.md`, `src/modules/auth/contracts.ts`, and `src/modules/auth/routes.ts`. The older storefront audit contains proposals, not the authoritative backend response contract.

| Route | Request | Success |
| --- | --- | --- |
| POST `/api/auth/signup` | JSON `{email,password,name?}` | 201, user/session, session cookie |
| POST `/api/auth/login` | JSON `{email,password}` | 200, user/session, session cookie |
| POST `/api/auth/logout` | JSON `{}` | 204, empty body, expired session cookie |
| GET `/api/auth/me` | Incoming Cookie | 200 user/session or 401 anonymous |

`src/lib/api/auth.ts` uses the existing server-only `MARIHANDMADE_API_URL`, an eight-second timeout, `cache: 'no-store'`, no redirects, and runtime Zod validation. The shared DTO is `{user:{id,email,name,phone,isEmailVerified,isPhoneVerified},session:{expiresAt}}`. Unexpected response properties are stripped; credentials and session tokens are never serialized into client state. Error bodies retain the documented `{error:{code,message}}` structure. A transport/timeout/malformed-response failure becomes a safe 503 at the forwarding boundary; a valid backend error keeps its original status/code. There are no auth-body, cookie, or credential logs.

`src/lib/auth-forwarding.ts` bounds incoming mutation bodies to 4 KiB and forwards the body and relevant Content-Type unchanged. It forwards Cookie and the actual Origin, but no caller user-ID, Authorization, forwarded host/proto/IP, or arbitrary headers. It preserves backend status, safe JSON, Retry-After, and individual Set-Cookie headers, including commas inside Expires. Private responses use `Cache-Control: no-store`; the routes are force-dynamic. `/me` is never cached.

## Origin and cookie policy

Next validates mutation Origin against the actual request URL origin in development/test, including its explicit port, then forwards it unchanged. `NEXT_PUBLIC_APP_URL` is not a development auth allowlist: a copied public-link placeholder must not override `http://localhost:7777`. Production requires an explicit HTTPS `NEXT_PUBLIC_APP_URL` and uses its canonical origin, including behind a reverse proxy where the Next request URL may be internal. Production has no request-URL or localhost fallback. Neither policy reconstructs an origin from Host or X-Forwarded-* headers. Missing Origin, literal `null`, foreign origins, and forged forwarding headers do not receive a manufactured trusted Origin. Fastify independently enforces its exact allowlist. Browser calls remain same-origin; no direct browser-to-Fastify CORS configuration is needed.

Backend cookies are relayed without changing Domain, Secure, HttpOnly, Path, SameSite, expiry, or name:

- Development: `mh_session`.
- Production: `__Host-mh_session`, Secure, HttpOnly, SameSite=Lax, Path=/, no Domain.
- Backend sessions have a fixed 30-day expiry. `/me` does not renew them, so SSR does not need to persist rotation cookies.
- Logout asks Fastify to revoke the presented session and relays its expiration cookie. A failed revocation does not claim successful logout.
- Auth forwarding responses also expire old NextAuth session cookies, observed numeric chunks, callback and CSRF cookies, with their original host/path/security scopes. Those JWTs are never accepted as identity. Secure historical cookies must be cleared over HTTPS.

## Server identity and transitional persistence

`getServerAuthSession()` reads Next request cookies and forwards them explicitly to backend `/me`. Only 401 becomes `null`. Backend 403, 5xx, malformed output and transport failure throw; they cannot create an anonymous/guest order accidentally. `getCurrentUserId()` and `getRequiredUserId()` preserve existing call sites. No helper takes caller-provided userId.

Existing consumers now inherit backend identity without changing their database response shapes:

- Profile read/update and profile SSR.
- Address creation/detail API and list/detail SSR.
- Wishlist reads/mutations and cart reads/mutations/merge.
- Checkout preparation and order creation/list/detail/SSR.
- Account payment access shared by PayPal create/capture/sync and other payment entry points.
- Email subscription POST and phone subscription POST/DELETE. Existing email unsubscribe DELETE remains independently token-authorized.

These Next routes still use Prisma temporarily. Other Web database consumers (reviews, blog/sitemap, content helpers and payment reconciliation) remain. Prisma and generated client are retained. No backend repository files, Prisma schemas or migrations were modified.

Address-detail SSR now requires backend-authenticated identity and queries by both `id` and `userId`. A missing/foreign address returns not-found; anonymous visitors redirect to login; the existing `new` address form remains available to authenticated users. Tests exercise owner A requesting owner B's address. Unrelated address CRUD gaps were not redesigned.

## Client state and auth actions

`AuthProvider` reads same-origin `/api/auth/me` and exposes `loading`, `authenticated`, `unauthenticated`, and `error`. Outage is distinct from logout. Browser cookies use same-origin credentials; no token is readable by JavaScript. A request version prevents older reads from restoring revoked identity.

The provider refreshes on mount, focus, visibility, and cross-tab localStorage notifications. The notification contains only a change marker. If storage is unavailable, focus/visibility refresh still works. There is no background polling. Identity changes reset profile/cart/descendant state and refresh server-rendered content. A visible error message and blocked checkout/cart actions prevent treating unavailable auth as guest mode.

The mounted login form submits `/api/auth/login`, refreshes identity, validates a same-origin callback (rejecting foreign origins, credentials, backslashes and control characters), navigates to it or `/`, and refreshes server state. Invalid credentials use one generic message. Validation, disabled-account, rate-limit and service failures have safe feedback.

Signup retains email/password/confirmation fields. Confirmation is checked locally and omitted from the strict backend body. One `/signup` request creates both user and session; there is no second login. The UI refreshes identity and navigates to `/`.

The active header includes Logout for authenticated users. It posts `{}` to `/logout`; on success it clears client identity, broadcasts the change, discards profile/account-cart state, navigates to `/login`, and refreshes server content. Repeated logout remains backend-idempotent. Failure keeps the session state and offers a retry instead of claiming revocation.

## Cart and payment compatibility

Guest carts remain in localStorage `Cart`; account carts remain in the database. Guest merge waits for backend-authenticated identity and its profile. Successful merges remove the exact guest snapshot; account carts are never written back to guest storage. Old locally persisted carts carrying `userId` are discarded rather than merged into a different account. Merge operations are serialized within a tab and across tabs through Web Locks where supported. Removing the redundant product-level cart provider also prevents duplicate merge owners.

Late profile/cart responses cannot restore the previous account's data after identity changes. Pending/failed auth blocks cart actions and checkout. Existing additive merge persistence has no server idempotency key: a lost response after commit can still require reconciliation, and browsers without Web Locks cannot guarantee cross-tab exactly-once merges. That persistence redesign remains separate work.

`guest_order_access` remains an independent signed capability with the existing order/email validation and two-hour lifetime, HttpOnly/SameSite=Lax/Path=/ cookie and production Secure semantics. It is not converted into a customer session or removed by logout. A valid capability for a guest order is checked before contacting customer auth, allowing guest PayPal completion even during an auth outage. It cannot authorize an account-owned order. Account payment access uses backend User.id. Customer email matching alone never claims a guest order.

PayPal create, capture, sync, return token handling, provider/order checks, reconciliation and persistence remain intact. Webhooks still verify the PayPal signature and never require customer auth. Offline tests cover both ownership modes, return-token handling, provider-reference rejection, guest expiry/tampering, and signature-authorized webhook behavior. They do not prove live PayPal delivery.

## NextAuth cleanup and remaining legacy flows

Removed the NextAuth catch-all handler, credential configuration, SessionProvider/useSession/signIn/signOut usage, augmentation types, unused JWT helper, and direct `next-auth`, `@next-auth/prisma-adapter`, and `jose` dependencies. Runtime source retains only historical cookie-name strings for expiration. There is no JWT bridge or second session system. `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `JWT_SECRET_KEY` are unnecessary for customer auth.

Password reset and email verification APIs/pages still use their existing Web Prisma/token/email logic; bcrypt remains for reset. They do not establish customer session identity and were not migrated to nonexistent backend endpoints. The audit's shared reset/verification token-purpose weakness and lack of coordinated reset session revocation remain follow-up work, not fixes claimed here. Retired OTP endpoints remain 410. These legacy flows must be reviewed before broader auth-feature rollout.

## Environment and local setup

No real values were added or exposed. `.env.example` documents:

| Variable | Owner / use |
| --- | --- |
| `MARIHANDMADE_API_URL` | Web server-only backend base, e.g. `http://localhost:3001`, no `/api` suffix |
| `NEXT_PUBLIC_APP_URL` | Actual storefront URL; production Next auth mutation Origin policy and existing email links |
| `NEXT_PUBLIC_URL` | Existing public site/sitemap URL; keep consistent with storefront deployment |
| `AUTH_TRUSTED_ORIGINS` | **Backend only**, comma-separated exact storefront origins, no paths/trailing slash/wildcards |
| `GUEST_ORDER_TOKEN_SECRET` | Independent Web guest-order secret, required in every environment; preserve the current production value |
| `DATABASE_URL`, `DIRECT_URL` | Existing transitional Web database configuration; not customer-session validation |

For isolated local development, configure Web `MARIHANDMADE_API_URL=http://localhost:3001`, `NEXT_PUBLIC_APP_URL=http://localhost:7777`, and `NEXT_PUBLIC_URL=http://localhost:7777`. Configure backend `AUTH_TRUSTED_ORIGINS=http://localhost:7777` (its default port-3000 origin is insufficient). Use the exact same hostname in the browser; `127.0.0.1` is a different origin. Start Web with `npm run dev` and the backend only against an intentionally chosen development database. Both services must refer to matching user/commerce IDs in that isolated environment.

Set a dedicated development `GUEST_ORDER_TOKEN_SECRET`. The old development fallback through NextAuth/JWT secrets was removed deliberately. To preserve an outstanding *development* guest capability, copy its previously effective secret into the dedicated variable before switching. Production already required the dedicated secret; no production guest-secret or token-format change was made.

## Production deployment and smoke-test prerequisites

1. Establish the actual HTTPS storefront origin; none is hardcoded here. Configure `NEXT_PUBLIC_APP_URL` at Web build/runtime, matching existing public/link settings. Add its exact serialized origin to backend `AUTH_TRUSTED_ORIGINS`.
2. Deploy compatible backend and Web together; confirm server-only backend reachability, Node runtime, and production cookie mode. Preserve all Set-Cookie headers and no-store through hosting/CDN/proxy layers.
3. Preserve existing `GUEST_ORDER_TOKEN_SECRET` and PayPal settings. Do not rotate guest capability secrets as part of customer auth.
4. Review the rate-limit topology before public rollout. Backend currently has `trustProxy=false`, in-memory socket-IP limiting; all requests from a Next proxy can share one quota. Establish trusted ingress/edge controls and test limits. This Web change intentionally does not forward arbitrary client IP headers or change backend proxy trust.
5. Run browser smoke tests against an authorized isolated/staging environment: signup, login, refresh/SSR, invalid credentials, origin rejection, logout/replay, multiple tabs/account changes, guest-cart merge, address isolation, outage behavior and cookie attributes. Use PayPal sandbox for guest/account create/return/capture/sync and webhook tests. Live signup or production mutations were not performed in this task.

## Validation and rollback

Validation uses synthetic HTTP responses and mocked Prisma/payment services; unmocked test fetches are rejected. The full suite passes: **134 tests across 12 files** (85 new auth/cutover tests, plus 49 existing regression tests). Lint reports no warnings or errors; strict typecheck and the final production build pass. `git diff --check` also passes. The full suite covers public catalog/home/product/category regressions as well as the cutover. Commands: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. TypeScript remains strict.

The production build is run with `DATABASE_URL`/`DIRECT_URL` pointing at an unreachable loopback database and `MARIHANDMADE_API_URL=http://127.0.0.1:9`, overriding local environment connection values. It does not require live services. The build's outdated Browserslist-data notice is unrelated to auth.

Rollback must retain user IDs, password hashes, commerce writes and the guest secret. Old Web cannot read opaque backend sessions, and its broken rendered login is not a suitable automatic rollback target. Prefer a corrected release retaining this backend identity boundary. If returning to an older auth architecture is separately chosen, plan explicit re-login and do not silently revive old JWT acceptance; backend sessions need a separately authorized revocation policy. No schema/data rollback is part of this milestone.

Remaining migrations: profile/addresses, wishlist/cart, subscriptions, checkout/orders/payment persistence, reset/verification security and backend ownership, reviews/content/sitemap, then removal of Web Prisma. Distributed auth rate limiting and idempotent cart merge also remain separate work.

## Changed-file inventory

The pre-existing untracked `docs/auth-storefront-audit.md` is preserved unchanged and is not part of this implementation. No commit or push was performed.

- `.env.example`
- `docs/backend-auth-cutover.md`
- `package-lock.json`
- `package.json`
- `src/app/(store)/(routes)/cart/components/item.tsx`
- `src/app/(store)/(routes)/products/[productId]/components/cart_button.tsx`
- `src/app/(store)/(routes)/profile/addresses/[addressId]/page.tsx`
- `src/app/(store)/(routes)/wishlist/page.tsx`
- `src/app/(store)/checkout/page.tsx`
- `src/app/api/auth/[...nextauth]/route.ts` (removed)
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/app/api/auth/signup/route.ts`
- `src/app/login/components/login-form.tsx`
- `src/app/login/page.tsx`
- `src/app/providers.tsx`
- `src/app/signup/components/signup-form.tsx`
- `src/components/native/nav/parent.tsx`
- `src/components/native/nav/user.tsx`
- `src/hooks/useAuthentication.tsx`
- `src/lib/api/auth.ts`
- `src/lib/auth-contracts.ts`
- `src/lib/auth-forwarding.ts`
- `src/lib/auth.ts`
- `src/lib/cart.ts`
- `src/lib/client-auth.ts`
- `src/lib/jwt.ts` (removed)
- `src/lib/order-access.ts`
- `src/state/Auth.tsx`
- `src/state/Cart.tsx`
- `src/state/User.tsx`
- `src/types/next-auth.d.ts` (removed)
- `tests/auth-boundary.test.ts`
- `tests/auth-checkout.test.tsx`
- `tests/auth-client.test.tsx`
- `tests/auth-ownership.test.tsx`
- `tests/auth-payments.test.ts`
- `tests/auth.fixture.ts`
- `tests/catalog.test.tsx`
- `tests/providers.test.tsx`
- `tests/storefront.test.tsx`
- `vitest.setup.tsx`
