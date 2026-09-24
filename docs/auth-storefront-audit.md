# MariHandmade storefront authentication compatibility audit

Audit date: 2026-09-22. Scope: this checkout of `marihandmade-web`, including installed dependency source and the lockfile. Read-only inspection; the sole output is this document. No application execution, production requests, database queries, dependency installation, migrations, commits or pushes were performed.

**Evidence labels:** **Confirmed** means established from inspected source, not live production testing. **Likely** means a runtime consequence inferred from that source. **Unknown** means deployment/data or runtime evidence is required. Backend findings in the task are supplied context, not independently verified here. References below are repository-relative; dependency references are to installed `node_modules` source matching the pinned version.

## A. Current auth architecture

**Confirmed:** Next.js `14.2.15`, NextAuth `4.24.7` (v4, despite Auth.js terminology in comments), `@next-auth/prisma-adapter` `1.0.7`, `bcryptjs` `3.0.3` in `package-lock.json`. `src/lib/auth.ts:19-62` configures `PrismaAdapter(prisma)` but explicitly overrides its database-session default with `session: { strategy: 'jwt' }`.

Only the Credentials provider is registered. Its `authorize` returns `{ id, email, name }`. No OAuth, email magic-link or OTP provider is registered. `src/lib/google.ts` contains OAuth helpers but has no consumers; its existence and Google environment names do not establish Google login. `src/lib/jwt.ts` contains unused HS256 helpers using `JWT_SECRET_KEY`; current customer authentication does not call them.

Callbacks: `jwt` copies `user.id` into `token.id` on login and otherwise returns the token unchanged; `session` copies `token.id` into `session.user.id`. No custom sign-in, redirect, encode/decode, event, cookie, lifetime or update-age configuration exists. Default redirects permit relative URLs and same-origin absolute URLs, otherwise use the auth base origin (`next-auth/core/lib/default-callbacks.js`). Custom sign-in page is `/login`.

`src/app/api/auth/[...nextauth]/route.ts` dispatches GET/POST to `NextAuth(getAuthOptions())`, with `force-dynamic`. Auth secret is `NEXTAUTH_SECRET`, required by the application in production and optional in development. No secret values were recorded.

`src/middleware.ts` matches `/profile/:path*` and `/wishlist/:path*` but always returns `NextResponse.next()`. It neither protects pages nor injects identity. Server consumers call the session helpers in `src/lib/auth.ts`; client consumers use `SessionProvider → useSession → useAuthenticated`, then a separate profile fetch. Root layout wraps all pages in the providers, without supplying an initial server session.

**Critical wiring distinction:** the rendered `/login` page has its own plain HTML form, not the separate client `LoginForm` component. The only `UserNav` logout component has no import/render consumers in `src`. These facts materially qualify claims that login/logout work end-to-end; see E.

## B. Password authentication

Evidence: `src/app/api/auth/signup/route.ts`, `src/lib/auth.ts:28-40`, `src/app/api/auth/reset/confirm/route.ts`, installed `bcryptjs/index.js` and `@persepolis/regex/dist/index.js`.

- Signup and password reset hash the **unmodified password** with `await bcrypt.hash(password, 10)`. This is bcrypt, cost 10, with a fresh library-generated 16-byte salt; installed bcryptjs emits `$2b$` hashes. No pepper, prehash, Unicode normalization or password trimming is applied. No Argon implementation exists.
- Signup/reset require a string of at least 6 JavaScript string code units. There is no maximum, complexity rule or explicit bcrypt length guard. Bcrypt's 72-byte UTF-8 truncation behavior matters for compatibility. Signup optionally compares `confirmPassword` if supplied; browser signup requires it. Reset has no confirmation field.
- Signup, credentials login, reset request and verification request trim and lowercase email. Lookup is exact `User.email`, not a case-insensitive query. Historical nonnormalized records may not match; their existence is unknown.
- Shared email validation is restrictive: `^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$`. In particular it rejects plus-addresses and TLDs longer than four letters. This is more restrictive than the browser email input.
- Credentials login requires a nonempty password, but does not impose the signup minimum on existing passwords. It calls `bcrypt.compare(password, user.passwordHash)` after lookup. Missing user, null/empty hash, invalid email and wrong password all return `null` to NextAuth. There is no password-login attempt counter, cooldown or lockout.
- Neither `isBanned` nor either verification flag is checked. Correct-password banned and unverified accounts are accepted by the credentials implementation. This is current behavior, not a recommended future ban policy.
- Duplicate signup returns 400 even if the existing account has a null hash. It does not link, replace or claim that account. A concurrent unique-key race reaches generic 500.

**Compatibility conclusion:** existing bcrypt hashes can be verified unchanged in Fastify, preferably initially with the same bcryptjs implementation/semantics. Preserve stored strings, IDs and normalization rules; do not rehash hashes or require a bulk password reset. Test UTF-8, whitespace and >72-byte passwords before changing libraries. Production hash formats, null-hash population and historical email casing are **unknown**. Null-hash users cannot password-login; the existing email reset flow can set a password for an existing email account, including a null-hash account. Phone-only accounts have no active login/recovery path in this checkout.

## C. Session implementation

Evidence: `src/lib/auth.ts`, `next-auth/core/init.js`, `core/lib/cookie.js`, `core/routes/{callback,session,signout}.js`, `jwt/index.js`, `next/index.js`, `react/index.js`.

**Confirmed:** customer sessions are encrypted JWTs (JWE: `alg=dir`, `enc=A256GCM`, key derived from auth secret by HKDF-SHA256), not opaque database sessions. Claims include default `sub`, name/email, optional picture, custom `id`, and library-issued `iat`, `exp`, `jti`. The credentials callback directly encodes a JWT; it does not call adapter session/account creation. Session reads and signout take the JWT branches. **Prisma `Session` is not used by these active flows**, despite the configured adapter and model. No direct application `prisma.session` calls were found. This does not prove the production table is empty.

| Purpose | HTTP-mode name | HTTPS-mode name | Attributes / lifetime |
| --- | --- | --- | --- |
| Customer session | `next-auth.session-token` | `__Secure-next-auth.session-token` | HttpOnly, SameSite=Lax, Path=/, Secure according to auth URL scheme, no Domain; expires 30 days after issuance/refresh |
| Redirect callback | `next-auth.callback-url` | `__Secure-next-auth.callback-url` | Same attributes; no explicit expiry/maxAge (browser-session cookie) |
| NextAuth CSRF | `next-auth.csrf-token` | `__Host-next-auth.csrf-token` | Same attributes; no explicit expiry/maxAge |
| Guest order capability | `guest_order_access` | `guest_order_access` | HttpOnly, SameSite=Lax, Path=/, no Domain; Secure iff NODE_ENV is production; maxAge 7200 seconds |
| Retired auth cleanup | `token`, `logged-in` | Same | Only deletion remains; no current issuing code or original attributes established |

Session cookie chunks can be named `next-auth.session-token.0`, `.1`, etc., or `__Secure-next-auth.session-token.0`, `.1`, etc. Library OAuth cookie definitions (`next-auth.pkce.code_verifier`, `next-auth.state`, `next-auth.nonce`, with HTTPS prefix) are present but are **not active credentials-flow cookies**.

Default maxAge is 2,592,000 seconds (30 days) for session and JWT. Session cookie issuance uses `Expires`; no explicit session-cookie Max-Age is set. Default `updateAge=86400` exists but applies to database session updates, not this JWT branch. `/api/auth/session` decodes, runs callbacks, re-encodes with fresh expiry and returns Set-Cookie on successful reads. There is no database revalidation of user existence, ban state, password change or profile changes. Names/emails can remain stale in JWT claims.

Every application server helper calls one-argument `getServerSession(options)`. Installed `next-auth/next/index.js` treats that as its RSC path: reads `next/headers` cookies, uses no-op response setters, and removes `expires` from the returned session. Thus **these server helper calls do not persist rotation cookies**, including when used from route handlers. Browser session endpoint reads can rotate them.

Client `SessionProvider` fetches the session on mount, synchronizes across tabs and refetches on visibility/focus by default; no periodic refetch interval is configured. `useAuthenticated` collapses both loading and unauthenticated into `false`. `/api/auth/session` uses `{}` when absent; server helper returns `null`; client hook resolves to unauthenticated/null.

NextAuth signout clears session cookie/chunks (maxAge 0). No DB session deletion occurs for JWT strategy and no server revocation list exists: a copied JWT remains valid until expiry. Resetting a password also does not revoke it. Callback/CSRF cookies and guest order capability are not explicitly cleared by application logout.

## D. Signup flow

Evidence: `src/app/signup/page.tsx`, `signup/components/signup-form.tsx:11-29`, `api/auth/signup/route.ts:6-47`, generated `User` schema.

1. Rendered signup component submits `email`, `password`, `confirmPassword` as JSON to `POST /api/auth/signup`.
2. Route also supports URL-encoded bodies. It normalizes/validates email, validates password and optional confirmation, checks duplicate email, hashes with bcrypt cost 10 and creates only `{ email, passwordHash }`.
3. Generated schema defaults: cuid User.id; `isBanned`, `isEmailVerified`, `isPhoneVerified`, both subscription flags false; OTP null, attempt count 0, lock/sent timestamps null; nullable name/phone/birthday remain null. Default correctness in production is unknown. No cart, address, Account, Session or verification token is explicitly created.
4. Endpoint returns **201, empty body, no session cookie**. Invalid email/password/mismatch/duplicate return **400 plain text** (`Invalid email`, `Password too short`, `Passwords do not match`, `Email already registered`); exceptions return **500 plain text** `Internal error`.
5. Browser then calls `signIn('credentials', { email, password, callbackUrl: '/' })`. Thus **signup auto-login is implemented as a second request in the UI**, not in signup API. Successful credentials callback issues the JWT and navigates to `/`. No verification email is sent and verification is not mandatory.

Failed signup responses are displayed as text. Auto-login failure is not explicitly handled by the signup component. Creation and login are not atomic; the account can exist even when subsequent sign-in fails.

## E. Login/logout flow

### Rendered login versus available credentials mechanism

**Confirmed:** `src/app/login/page.tsx:78-115` renders a normal POST form to `/api/auth/signin`. Fields are `callbackUrl=/`, `provider=credentials`, email, password. It provides **no CSRF token**. NextAuth chooses provider from the URL segment, not this body field (`next-auth/next/index.js`, `core/index.js`). Its POST signin branch requires both verified CSRF and a selected provider; otherwise it redirects to `/api/auth/signin?csrf=true`, whose GET redirects to configured `/login` with callback URL. **Likely runtime result:** rendered login returns to login without authorizing credentials or creating a session. This was not browser-tested. The page does not consume error query parameters.

`src/app/login/components/login-form.tsx` instead calls `signIn('credentials', { redirect: true, callbackUrl: '/', email, password })`, but is **unreferenced**. The same valid mechanism is used by active signup. Installed `next-auth/react/index.js` obtains provider/CSRF information, posts URL-encoded credentials plus CSRF/callbackUrl/json to `/api/auth/callback/credentials`, then follows the returned URL. Credentials verification is as in B; success creates the JWT and session cookie, with no Session row. Null authorize result yields `CredentialsSignin` (401 at callback result, subsequently error/signin redirects); thrown authorization errors enter the error redirect path. The unmounted client component's `result?.error` does not reliably provide inline errors with `redirect:true`.

No active `/api/auth/login` implementation exists. Future migration must deliver a usable login form rather than preserve the broken transport wiring. This is prerequisite to recommending a one-time re-login.

### Logout

`src/components/native/nav/user.tsx:26-43` implements Logout → `signOut({ redirect:false })` → POST `/api/auth/logout` → `window.location.assign('/login')`. NextAuth signOut obtains CSRF, posts `/api/auth/signout`, clears JWT cookie/chunks and broadcasts session change. Custom logout POST returns 200 `{ok:true}` and deletes only legacy `token` and `logged-in`; GET returns 405 `{error:'Use Auth.js signOut for customer logout'}`. Calling custom POST alone does **not** log out a NextAuth session.

**UI reachability:** `UserNav` has no consumer in this source; active root header has fixed Account/Wishlist/Cart links, not this menu. NextAuth's default `/api/auth/signout` page remains available through its catch-all. A visible current logout trigger is not established.

There is no explicit `localStorage.Cart` cleanup, guest-token cleanup or UserContext reset in the custom logout sequence. Full navigation would discard in-memory state. UserContext itself does not clear a previously fetched user when authentication becomes false; cross-tab expiry/signout can leave stale profile/cart state until navigation. These are migration regression cases, not behaviors to reproduce as security guarantees.

## F. OTP flows

**Confirmed:** all four POST handlers at `src/app/api/auth/otp/{email,phone}/{try,verify}/route.ts` ignore the request and return **410** JSON `{error:'Legacy OTP customer login is no longer available.'}`. Their only dependencies are NextRequest/NextResponse. They create no codes, DB state, cookies, sessions or verification-flag changes, and invoke no delivery provider.

Actual purpose is a **retired legacy customer-login mechanism** according to route comments, not current signup, verification or recovery. Code generation/storage/expiry/attempts/lockout/resend cooldown are **not implemented in these routes**; old historical behavior is unknown and cannot be inferred from schema fields. Email and phone behave identically. `tests/otp.test.ts` asserts phone endpoints return 410 without Set-Cookie; tests were inspected, not run.

`User.OTP`, `otpAttemptCount`, `otpLockedUntil` are not active auth controls. `otpLastSentAt` is repurposed for email verification/reset request throttling (G/H). Unused `sendOTPEmail` delegates to Resend infrastructure; installed SMS/RNG/mail packages and type declarations do not establish active OTP delivery. No UI OTP calls found. **No functional backend OTP endpoints are needed for parity**; retaining 410 stubs is sufficient.

## G. Email verification

Evidence: `src/app/api/auth/verify/{request,confirm}/route.ts`, `src/lib/auth-request-throttle.ts`, `src/lib/resend.ts`, `src/app/verify/[token]/page.tsx`.

Request POST accepts JSON or URL encoding, normalizes/validates email, looks up the user and, if eligible, creates `crypto.randomBytes(32).toString('hex')` (256-bit entropy, 64 hex characters), expiring in one hour. `VerificationToken` stores **plaintext token**, normalized email as identifier, and expiry. No purpose discriminator or hashing is used.

Both request and confirmation are **unauthenticated**. Missing account or cooldown yields the same 200 JSON as sent mail: `{status:'success',message:'If an account exists, an email has been sent.'}`. Invalid email is 400. Shared 60-second cooldown reads/writes `User.otpLastSentAt`, before token creation/delivery. Checks/writes are not atomic; concurrent requests can pass. Delivery failure can leave token and cooldown behind and return 500, so enumeration protection is not timing/failure-proof.

Email link uses `NEXT_PUBLIC_APP_URL` plus `/verify/<token>`. `sendEmail` uses Resend by default in production and log mode by default outside production; `EMAIL_SEND_MODE` overrides. Credentials/sender names: `RESEND_API_KEY`, `EMAIL_FROM`, fallback `RESEND_FROM_EMAIL`. Log mode acknowledges without sending and logs masked recipient metadata, not a usable token/link. Production delivery configuration is unknown.

The link renders a confirmation button with hidden token; it does not verify on GET. POST confirm finds token, rejects absent/expired record with 400, updates `User.isEmailVerified=true` by record.identifier email, deletes that token, and returns 200 `{status:'ok'}`. It does not set a session or redirect. There is no `emailVerified` timestamp update. Missing token is 400; unexpected failure (including absent user during update) is 500. Errors use `{status:'fail'|'error',message,errors:null}` from `getErrorResponse`.

No storefront caller of `/api/auth/verify/request` was found; signup does not call it. Confirmation page and APIs are nevertheless executable. Neither login nor checkout requires verification. Preserve request/confirm capability for endpoint/link compatibility if retiring Web auth; no new verification gate is required.

**Security finding:** reset and verification tokens are interchangeable. Neither confirmation checks purpose: an unexpired verification token can reset a password, and a reset token can verify email. Purpose separation is a required design decision before migration. Do not blindly carry legacy token rows into a supposedly purpose-scoped implementation.

## H. Password reset

Evidence: `src/app/api/auth/reset/{request,confirm}/route.ts`, `src/lib/password-reset-email.ts`, request throttle/delivery above, `src/app/reset/page.tsx`, `src/app/reset/[token]/page.tsx`.

Reset is reachable through the rendered login page. Request form posts URL-encoded email directly to `/api/auth/reset/request`, so the browser navigates to the JSON response. API also accepts JSON. Email validation, neutral 200 response, shared 60-second cooldown and delivery failure behavior match G. Only existing users get a token; no user is created. No banned/verified/hash-presence condition is enforced.

Token generation/storage/expiry are identical to verification: random 32 bytes, plaintext hex token, normalized email identifier, one hour, shared untyped VerificationToken table. Email links use `NEXT_PUBLIC_APP_URL` plus `/reset/<token>`.

Confirmation page posts hidden token and new password directly to `/api/auth/reset/confirm`. Route validates token string and password length >=6, checks record and expiry, resolves user by identifier, hashes with bcrypt cost 10, updates passwordHash, deletes the used token, and returns 200 `{status:'ok'}`. Invalid/missing/expired token or short password is 400; missing user deletes the token then returns 400 `User not found`; unexpected errors are 500. There is **no auto-login or redirect** after reset; browser sees JSON and must navigate to login. Verification flags remain unchanged.

Existing JWTs remain valid, other outstanding reset/verification tokens remain valid, and expired rows are not cleaned here. Update/delete are separate operations, not a transaction; concurrent consumption is not reliably single-use. No confirm-attempt limit exists. Future session revocation and purpose-scoped/hashed tokens would be intentional security changes requiring tests. Both reset endpoints are required to preserve the active recovery feature.

## I. Current-user consumers

Paths under `src/`; this table inventories meaningful identity use rather than treating every presentational child as a separate authenticator.

| Domain / consumers | Identity and ownership source | Notes |
| --- | --- | --- |
| Root `app/layout.tsx`, `app/providers.tsx`, `hooks/useAuthentication.tsx` | SessionProvider and `useSession().status` | All pages wrapped; no SSR session hydration; loading collapsed into false |
| `state/User.tsx` | Auth status then `/api/profile`; stores profile locally | Fetch/refresh; no explicit reset on unauthenticated transition; no response.ok check before parsing |
| Active `components/native/nav/parent.tsx` | CartContext only | Fixed account link to `/profile/edit`; no direct user/session display. Desktop/mobile/sidebar navigation and profile switcher use navigation state, not identity |
| `components/native/nav/user.tsx` | NextAuth signOut | Unmounted logout implementation (E) |
| `api/profile/route.ts`, `api/profile/update/route.ts` | Session.user.id → Prisma User | No caller userId accepted. Update only trimmed name/phone; email changes unsupported. Profile form uses server-provided name/phone/email; does not refresh JWT/UserContext |
| `profile/edit/page.tsx` | Server session → User lookup | Redirect `/login` if absent; selects name/phone/email |
| `profile/addresses/page.tsx`; `api/addresses/route.ts`; `api/addresses/[addressId]/route.tsx` | Session ID → list/create; ID+owner for detail | Anonymous APIs 401; list SSR redirects; create sets userId from session |
| `profile/addresses/[addressId]/page.tsx` | **Only caller URL addressId → Prisma** | **Unprotected address read / ownership gap**; no parent auth guard; middleware does not help. Full record is passed into a client form |
| Address clients/forms | Server props + same-origin API | Main list delete calls DELETE `/api/addresses/:id`, but route has only GET. Legacy edit form actually POST-creates; delete calls nonexistent singular `/api/address/:id` |
| `api/wishlist/route.ts` | Session ID → User wishlist relation | GET/POST/DELETE; caller productId selects product, never owner |
| `wishlist/page.tsx`; product `components/wishlist_button.tsx` | useAuthenticated, UserContext, wishlist API | Page active; button component has no import consumer found. Unauthenticated page redirects login, also has an effect pushing `/` when user absent |
| `state/Cart.tsx`, `lib/cart.ts` | Profile cart or localStorage `Cart` | Guest data is browser state, not identity; merges after user profile resolves |
| Product `components/cart_button.tsx`; cart `components/item.tsx`, grid/receipt/page; header | Auth hook + CartContext | Authenticated mutations use API; guests update local cart; presentational cart children use shared state |
| `api/cart/route.ts` | Session ID → Cart.userId / CartItem.cartId | GET/POST reject anonymous; product/variant IDs are item selectors |
| `app/(store)/checkout/page.tsx`; `api/checkout/route.ts` | Client status / server current-user helper | Guest input allowed; server prices products; GET requires user, POST permits guest lines |
| `api/orders/route.ts` | Current-user helper or guest payload | GET owner-only; POST connects session User.id or stores guest contact data, never accepts owner userId |
| `api/orders/[orderId]/route.tsx`; profile orders list/detail pages | Session ID + Prisma ownership predicates | Guest detail API 401; foreign/missing API record reaches generic 500; SSR detail uses notFound |
| `lib/order-access.ts`; payment init/create/capture/sync routes | Session matching order.userId OR signed guest capability | Raw caller orderId/providerOrderId is insufficient |
| `api/paypal/webhook/route.ts`; `lib/paypal.ts` | Verified provider event/order references, persisted order owner | No browser session required; never trust submitted customer identity |
| `app/pay/paypal/return/page.tsx` | URL order/provider IDs + automatically sent cookies | Calls protected capture API; query IDs alone are not authorization |
| `order-confirmation/page.tsx` | None | Static success text, no order lookup or ownership check; not proof payment succeeded |
| `api/products/[productId]/reviews/route.ts`; `components/product/ProductReviews.tsx` | Public product lookup + caller name/optional email | Public GET approved reviews, POST pending review; no authenticated user association or purchase check. Customer email is not verified identity |
| `api/subscription/email/route.ts` | POST session ID; DELETE body emailUnsubscribeToken | DELETE is unauthenticated bearer-capability lookup, not arbitrary userId; no explicit expiry in route |
| `api/subscription/phone/route.ts` | Session ID for POST and DELETE | No phone-verification prerequisite; no subscription API UI callers found |
| `middleware.ts` | None | Pass-through; never an authorization boundary |

No active request-header `X-USER-ID` or body userId trust was found in protected customer APIs. The specific address SSR URL-ID lookup is the exception to owner-scoped reads. Review attribution and guest contact fields are caller assertions; signed guest tokens authorize an already-created order, not an email account.

## J. Commerce/auth dependencies

**Cart:** guests persist full cart JSON under localStorage key `Cart`. Account carts use `Cart.userId` as primary key and `CartItem.cartId` pointing to it. On UserContext becoming populated, `state/Cart.tsx` sends positive local items to POST `/api/cart` with `merge:true`. Server adds counts for matching product+variant; absent items create records. Successful sync updates memory and writes JSON null to local storage. Failure retains local data and displays server cart. General dispatch/refresh also writes account cart snapshots to local storage; user changes/refetches can retrigger merging. Duplicate merges and account-to-account leakage require tests, not assumptions of idempotency.

**Wishlist:** requires session, persists User↔Product relation. No guest wishlist persistence/merge exists. Preserve User.id and product IDs.

**Checkout/orders:** POST checkout accepts guest or user-submitted lines and recalculates visibility, variant validity, inventory and price. GET checkout requires session cart. Order POST chooses account versus guest from **server** session. Account mode requires nonempty DB cart even if checkoutLines supplied, checks exact line/quantity correspondence, and validates supplied addressId with userId. Guest mode requires normalized email, first/last name, optional phone and valid checkout lines; creates no User. No verified-email or ban gate. Price/discount/inventory/order creation and account cart clearing span Prisma reads and a transaction; preserve this consistency when moving commerce.

Checkout UI requests GET `/api/addresses`, but that route only exports POST. **Likely** result is 405 and empty address selector. Saved addresses nevertheless work in SSR and can be selected by validated API input. Account order creation allows omitted addressId. This mismatch predates migration.

**Guest access:** `src/lib/auth.ts:79-209` creates an HMAC-SHA256 signed base64url JSON capability (not NextAuth JWT) with orderId, normalized guestEmail, iat/exp, default two-hour TTL. Returned both in order JSON as `guestOrderAccessToken` and HttpOnly `guest_order_access` cookie. `x-guest-order-access` header takes precedence over cookie. Payment access checks signature/expiry, exact orderId/email and **requires order.userId to be null**. Same-email logged-in account does not acquire a guest order automatically. One cookie slot means a newer guest order replaces the older cookie. Checkout keeps token only in component memory for create-payment header; PayPal return relies on cookie.

**PayPal:** `/api/orders/:orderId/pay`, `/pay/paypal`, `/pay/paypal/capture`, `/pay/paypal/sync` all call `resolveOrderPaymentAccess`. Account orders require their owner's NextAuth session; guest orders can use the signed capability. No route requires a session unconditionally for both kinds. Create uses persisted price/lines and order reference. Capture/sync retrieve provider order, validate reference and completed amount/currency before reconciliation; existing paid/payment-reference branches short-circuit. The webhook uses PayPal signature verification headers and `PAYPAL_WEBHOOK_ID`, provider lookup and stored references, not NextAuth. Reconciliation upserts PaymentProvider/Payment and marks Order paid/Processing; guest payment uses parameterized raw SQL with null userId. Preserve provider-order refId, capture stored in cardPan, order/user IDs and idempotency behavior.

PayPal return page sends cookies with POST capture and navigates to static confirmation. Changing customer cookies without updating payment identity resolution can break in-flight account payment returns. Keep guest signing secret/cookie compatible through cutover; backend outage must not silently downgrade an account session to guest checkout. `/api/orders/:id/ship` is a 404 stub.

## K. Direct Prisma inventory

All paths below are under `src/`. Shared runtime: `lib/prisma.ts` instantiates the frozen generated Prisma 5.22 client with `DATABASE_URL`, with engine path resolution (`PRISMA_QUERY_ENGINE_LIBRARY`, `AWS_EXECUTION_ENV`). Generated schema is evidence of expected shape, not production introspection. `lib/public-products.ts` has Prisma types/enum predicates, no database call itself. `types/prisma.ts` is handwritten DTOs.

| Group | Files | Direct operations / models |
| --- | --- | --- |
| A authentication | `lib/auth.ts` | PrismaAdapter registration, User email lookup for credentials; no active Session/Account calls |
| A authentication | `api/auth/signup/route.ts` | User lookup/create |
| A authentication | `api/auth/reset/request/route.ts`, `api/auth/verify/request/route.ts` | User lookup, VerificationToken create |
| A authentication | `api/auth/reset/confirm/route.ts`, `api/auth/verify/confirm/route.ts` | VerificationToken lookup/delete, User lookup/update |
| A authentication | `lib/auth-request-throttle.ts` | User otpLastSentAt read/update |
| B profile/addresses | `api/profile/route.ts`, `api/profile/update/route.ts` | User read/update; nested Cart/items/products, Address, Wishlist reads |
| B profile/addresses | `api/addresses/route.ts`, `api/addresses/[addressId]/route.tsx` | Address create/read |
| B profile/addresses | `app/(store)/(routes)/profile/edit/page.tsx`, `profile/addresses/page.tsx`, `profile/addresses/[addressId]/page.tsx` | User select, owner address list, unscoped address detail (latter two paths under same profile root) |
| C wishlist/cart | `api/wishlist/route.ts` | User wishlist read/connect/disconnect, nested product/catalog/inventory reads |
| C wishlist/cart | `api/cart/route.ts` | Cart reads/upsert, CartItem find/create/update/deleteMany, ProductVariant validation; batch transaction, nested product data |
| D checkout/orders/payments | `api/checkout/route.ts` | Cart read, Product/variants/inventory read |
| D checkout/orders/payments | `api/orders/route.ts` | Order list/create; Cart, DiscountCode, Address, Product, InventoryItem reads/updates; nested OrderItem creation, CartItem deletion; Owner reads, Notification creation; transaction |
| D checkout/orders/payments | `api/orders/[orderId]/route.tsx`, profile `orders/page.tsx`, `orders/[orderId]/page.tsx` | Owner-scoped order reads, related lines/products/variants/payments/address/refund as included |
| D checkout/orders/payments | `api/orders/[orderId]/pay/route.ts`, `pay/paypal/route.ts`, `pay/paypal/capture/route.ts`, `pay/paypal/sync/route.ts` | Order/payment/line reads; capture also User email lookup; reconciliation delegated |
| D checkout/orders/payments | `api/paypal/webhook/route.ts`, `lib/paypal.ts` | Payment/Order lookup; injected Prisma transaction; PaymentProvider/Payment upserts, guest Payment raw SQL, Order update |
| E reviews/subscriptions | `api/products/[productId]/reviews/route.ts` | Product validation; Review read/create |
| E reviews/subscriptions | `api/subscription/email/route.ts`, `api/subscription/phone/route.ts` | User subscription updates (email DELETE by unsubscribe token) |
| F unrelated content | `app/(store)/(routes)/blog/page.tsx`, `blog/[slug]/page.tsx`, `app/sitemap.ts` | Blog reads with Author relations; only blog portion of sitemap remains DB-backed |
| F unrelated content | `actions/get-banners.ts`, `actions/get-home-visuals.ts` | Banner, HomeHero, HomeCarouselSlide reads; no current callers found |

Here `api/...` abbreviates `app/api/...`; profile paths abbreviate `app/(store)/(routes)/profile/...`. OTP stubs, legacy logout, middleware, order-access helper and JWT helper perform no direct DB operation. Public catalog list/detail/actions use `lib/api/catalog.ts` HTTP boundary and are independently migrated. Transactional product validation and review validation still use Prisma.

## L. Backend compatibility analysis

Proposed endpoints are recommendations, **not existing backend behavior**.

| Proposed endpoint | Required compatibility |
| --- | --- |
| POST `/api/auth/signup` | Preserve email normalization, duplicate handling, bcrypt verification compatibility and existing User IDs/relations; accept existing JSON fields. Browser must still end up logged in and at `/`. Either retain empty 201 + explicit login request, or deliberately update UI for signup issuing session. No verification prerequisite |
| POST `/api/auth/login` | Implement actual working browser transport; verify existing bcrypt hashes unchanged, reject null hashes/wrong password without creating users. Preserve no verification gate. Explicitly decide ban policy (current code accepts banned users). Issue opaque session cookie, return safe user/session DTO; UI navigates `/` |
| POST `/api/auth/logout` | Revoke backend session server-side and expire correctly scoped cookie; safe repeat calls. Update UI so this becomes real logout, not today's legacy cleanup. Clear client identity/cache; handle old NextAuth chunks during cutover |
| GET `/api/auth/me` | Authenticate incoming opaque cookie, derive original User.id; no caller identity/header trust. Return stable safe DTO; anonymous result distinguished from backend failure. Browser and SSR must share the same authority |

**Questions answered explicitly:**

- **Hashes unchanged? Yes**, for hashes generated/accepted by this bcrypt implementation; verify historical production formats separately. No pepper dependency.
- **User.id unchanged? Yes**, retain the existing User records/database and foreign keys. Do not recreate accounts during login or migrate by email alone. Shared production database/schema alignment remains unverified.
- **Existing sessions survive automatically? No.** They are encrypted JWT browser cookies, with no active Session rows to migrate. Reusing cookie name alone does not convert them.
- **One-time re-login sufficient? Yes for existing password-capable accounts**, provided actual login UI works and all auth consumers switch together. Null-hash/phone-only users require a defined recovery route. Data/cart/wishlist/order ownership remains attached to unchanged IDs.
- **Bridge feasible? Technically**, via short-lived explicit validation/decryption of old NextAuth JWE with its secret, cookie/chunk format and claims, then lookup and issuance of backend sessions. This increases attack/rollback complexity and accepts old tokens that current logout/reset cannot revoke. No bridge exists. Prefer intentionally expiring old customer sessions.
- **Signup auto-login? Preserve the browser outcome**, although current signup endpoint itself does not authenticate.
- **Verified-email login requirement? No**, introducing one would lock out existing unverified accounts.
- **OTP? No active OTP implementation needed**; retain four 410 endpoints if maintaining old paths.
- **Verification? Preserve request and confirm APIs plus `/verify/:token` if preserving the exposed verification capability/links. Request UI is absent, so this is not a core-login prerequisite.** Resolve shared-token vulnerability explicitly.
- **Reset? Both request and confirm and their pages are genuinely required**, because login links to active recovery.

The four core endpoints alone do not replace password recovery or the profile/commerce APIs. Minimum complete auth-feature parity therefore includes the four core endpoints **plus reset request/confirm and verification request/confirm**, with OTP retirement stubs optional for path compatibility.

### User/session response shape

Current browser session shape: `{user:{id:string,name?:string|null,email?:string|null,image?:string|null},expires:string}`. Credentials provider does not supply image, so it can be omitted; no frontend avatar dependency was found. Server helpers currently omit expires as described in C. Preserve `session.user.id` for low-change server adapters and auth status (`loading`, `authenticated`, `unauthenticated`) in a replacement client provider. Suggested `/me`: this session-shaped object when authenticated, and a documented anonymous result (e.g. 401 that wrapper maps to null); never treat a 5xx as anonymous. This recommendation is not a claim that NextAuth's SessionProvider can directly consume opaque sessions: replace its implementation or supply an explicit compatibility facade for its protocol.

Current `/api/profile` returns **only** `{phone,email,name,birthday,addresses,wishlist,cart}`. It omits `id` and verification/ban/subscription flags despite optional fields in `UserWithIncludes`. Related cart uses `{userId,items,...}` with each item productId/variantId/count/product; addresses need id/country/address/city/phone/postalCode; wishlist uses product DTOs, richer through dedicated endpoint. Profile SSR selects name/phone/email separately. Optional typed user fields also include id, isBanned, isEmailVerified, isPhoneVerified, isEmailSubscribed, isPhoneSubscribed. These flags are not current session requirements. Keep expanded profile/commerce data in profile endpoints, not in auth cookies or `/me` by default. Never serialize passwordHash, OTP, reset tokens or unsubscribe capability into `/me`.

## M. Cookie/deployment compatibility

**Confirmed source assumptions:** browser fetches are same-origin relative URLs; SSR reads storefront request cookies. Development runs port 7777 (`package.json`); NextAuth fallback URL is localhost port 3000 (`utils/parse-url.js`). Docker exposes 3000, `next start` default. No auth forwarding/rewrite exists in `next.config.js` or `vercel.json`. Vercel config only sets static font cache headers/empty redirects. Actual production topology, cookie headers and environment correctness are unknown.

Relevant names only:

- Auth/origin: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_URL_INTERNAL`, `VERCEL`, `VERCEL_URL`, `AUTH_TRUST_HOST`, `NODE_ENV` (last five origin/trust names are also used by installed NextAuth where applicable).
- Guest capability: `GUEST_ORDER_TOKEN_SECRET`; development fallback `NEXTAUTH_SECRET`, then `JWT_SECRET_KEY`. Production requires the dedicated guest secret.
- Frontend/backend/database: `MARIHANDMADE_API_URL`, `DATABASE_URL`, `DIRECT_URL`, `PRISMA_QUERY_ENGINE_LIBRARY`, `AWS_EXECUTION_ENV`.
- Links/delivery: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_URL`, `EMAIL_SEND_MODE`, `RESEND_API_KEY`, `EMAIL_FROM`, `RESEND_FROM_EMAIL`, `ORDER_OWNER_EMAIL`.
- Payments: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_API_BASE_URL`, `PAYPAL_RETURN_BASE_URL`, `PAYPAL_CURRENCY_CODE`.
- Dormant OAuth helpers: `NEXT_PUBLIC_GOOGLE_OAUTH_ID`, `NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URL`, `GOOGLE_OAUTH_SECRET`.

Environment-file inspection extracted variable names only. `NEXTAUTH_URL` / `NEXTAUTH_URL_INTERNAL` are absent from both local/example key lists inspected; deployment-provided values are unknown. NextAuth detectOrigin trusts forwarded host/proto when `VERCEL` or `AUTH_TRUST_HOST` is enabled; otherwise uses NEXTAUTH_URL. Therefore Secure customer cookie choice follows **resolved auth URL**, not NODE_ENV alone, and localhost port/callback configuration needs verification. Do not conclude deployed cookie prefix from this checkout.

**Assessment:** a thin same-origin Next.js forwarding layer is compatible with opaque backend sessions. Browser cookies remain scoped to the storefront host; backend validates them from forwarded Cookie headers. Preserve all Set-Cookie headers individually (including expiry/rotation), appropriate host-only Domain omission, Path=/, HttpOnly, SameSite=Lax, Secure over production HTTPS. Internal backend HTTP does not mean browser cookies should lose Secure. Establish trusted external origin configuration rather than blindly trusting client-forwarded identity/host headers. Backend private hostname must not become cookie Domain or redirect destination.

SSR must explicitly forward the incoming storefront cookie to `/me` with `cache:'no-store'`; server fetch does not automatically carry browser cookies. No shared caching of user responses. Server components cannot by themselves persist refreshed browser cookies: route/proxy response paths must propagate rotation or use a deliberate backend expiry policy. Switching only browser routes leaves getServerSession reading the wrong format and is insufficient. Preserve CSRF protection for state-changing cookie-auth requests (NextAuth currently supplies it for its own sign-in/signout; custom routes lack equivalent explicit controls). SameSite alone is not a replacement for a considered CSRF/origin policy.

Use a distinct backend session cookie name to avoid parsing old JWTs as opaque IDs; its exact new name is not yet specified. Explicitly retire both historical prefixes/chunks. Keep `guest_order_access` and its independent verifier/secret during commerce coexistence. SameSite=Lax supports the top-level PayPal return followed by same-origin capture; test deployed return host and in-flight sessions.

## N. Recommended migration sequence

1. **Establish a verified baseline and resolve decisions.** Confirm production schema, password formats and original IDs through a separately authorized process; no DB access was performed here. Agree on ban policy, token purpose separation, null-hash recovery, broken login/logout wiring and address ownership gap. Do not classify those bugs as mandatory compatibility.
2. **Build backend core behind an inactive boundary.** Keep User IDs and passwordHash unchanged; implement bcrypt compare, signup, opaque sessions, logout/me, safe DTOs, expiry and CSRF/origin behavior. No schema migration assumed until production Session shape and uniqueness requirements are verified.
3. **Migrate reset/verification with an explicit token transition.** These can move independently while customer sessions remain NextAuth because they currently use no session. Avoid two uncoordinated writers/consumers of the same token space. Prefer invalidating/reissuing outstanding legacy links over preserving purpose confusion; document rollback and delivery/cooldown behavior. OTP remains retired.
4. **Prepare one identity adapter for all current consumers.** Client auth provider/hooks and server `getServerAuthSession`/current-user/required-user helpers must obtain identity from backend `/me`. Existing Next.js profile/cart/order Prisma logic can temporarily coexist if it obtains the same trusted backend-derived User.id and retains ownership predicates. Never forward an untrusted userId as authentication.
5. **Switch auth atomically with its consumers.** Deploy login/signup/logout transport, same-origin forwarding, browser status provider, SSR/API identity helpers and payment order-access helper together. Disable old credential/session issuance/acceptance according to the expiry decision. Merely forwarding four URLs is not a complete migration. Make logout visible and login usable. Plan in-flight PayPal return handling during a one-time re-login.
6. **Intentionally expire old customer JWTs by default.** Preserve data and require one fresh login, with email reset for eligible null-hash users. If uninterrupted sessions are a business requirement, implement/test a time-bounded JWE bridge with fresh user lookup and fixed retirement deadline; do not run indefinite dual auth. Keep guest-order capability compatibility across its outstanding TTL.
7. **Move domain persistence incrementally.** Profile/addresses, wishlist/cart and subscriptions can move after backend identity is authoritative, preserving response shapes. Move checkout/orders/PayPal transaction/reconciliation logic as coordinated commerce boundaries, avoiding split inventory/order transactions and duplicate webhook writers. Public reviews/content can migrate independently with their existing public/moderation boundaries. Public catalog stays on its existing HTTP boundary.
8. **Remove remaining Web DB dependency only when inventory K is empty.** Include blogs/sitemap/editorial helpers, raw payment SQL, adapter and generated-client enum/type consumers. Then retire Web DB configuration/dependencies in a separately authorized implementation task.

**Rollback:** retain original IDs and unchanged bcrypt format, preserve data writes and backend session compatibility for the rollback window. Rolling back to NextAuth cannot read opaque sessions; users would need another login unless a planned adapter remains. Do not silently reactivate long-lived old JWTs after explicitly revoking them at cutover. Changing NEXTAUTH_SECRET to expire sessions can also invalidate guest tokens in development if they use its fallback; production should use the dedicated secret. Reset-token storage/purpose changes and outstanding verification links need their own rollback strategy. Do not rotate PayPal references/guest secret just because customer auth changes.

## O. Required test plan

Tests below are required **before switching ownership**, using isolated fixtures/staging and authorized payment sandbox. This audit did not run tests/builds or contact services. Existing `tests/otp.test.ts`, `middleware.test.ts`, `providers.test.tsx`, `wishlist.page.test.tsx` and catalog tests are narrow/mocked and do not establish production auth correctness.

| Area | Required assertions |
| --- | --- |
| Existing login | Known bcrypt cost-10 user authenticates with unchanged hash/User.id/relations; normalized email; test legacy costs/prefixes from authorized fixtures, Unicode, spaces and 72-byte boundary; never accept caller userId |
| Login transport | Test actual rendered form through CSRF/endpoint/cookie/redirect, not just authorize; meaningful wrong-password errors; no open redirects; callback origin correct on port 7777 and production |
| Wrong password / missing account | Rejection without session creation; predictable non-enumerating login error; backend failure distinct from invalid credentials |
| Null passwordHash | Denied password login, duplicate signup remains duplicate; email reset can establish password by deliberate policy; phone-only recovery decision covered |
| Banned user | Assert documented current acceptance as baseline; separately approve/test intended denial and existing-session handling if policy changes |
| Signup | Normalization, minimum length, optional API confirmation, mismatch, duplicate/race, status/body, false initial flags; auto-login and `/` redirect; no orphaned/recreated commerce relations |
| Verification | Unverified user can login/checkout; request neutral response/cooldown/delivery; confirm changes only flag; expired/reused token rejected; require reset/verify cross-purpose rejection in future design |
| OTP | All four retired routes return 410 without DB mutation, delivery, cookies or verification changes; do not revive old OTP fields |
| Reset | Existing/missing/throttled account responses; delivery failures; expiry, replay/concurrent consumption, password hashing, null hash; desired session revocation; no unintended auto-login; user can subsequently login |
| Logout | Visible UI, server session revoked and cookie deleted, repeated logout safe; old cookie/chunks cleanup; copied new opaque token unusable; cross-tab user/cart state clears per policy |
| Session | Expiry, renewal cadence, inactive tab, multiple tabs/devices, expired/invalid cookies; no unintended JWT fallback; correct HttpOnly/Secure/SameSite/Path/Domain and localhost behavior |
| SSR/client current user | Same ID/status on initial load, refresh, direct protected URL and server API; no cross-user caching; backend timeout fails safely; no false guest order on auth-service outage; Set-Cookie survives forwarding |
| Profile | Session-owned read/update; hostile request IDs/headers ignored; no hash/token leakage; fresh profile versus session claims; deleted user handled |
| Addresses | User A cannot read user B via API **or SSR URL**; anonymous SSR denied; create owner enforced; list/delete route mismatches resolved/tested by separate implementation; checkout address ownership |
| Wishlist | Login-required reads/mutations, no cross-user relation changes; ID/product DTO compatibility and rendering |
| Cart | Guest local persistence; account DB cart; variant-specific merge once; repeated profile fetch/mount; multi-tab/concurrent merge; logout/account switch cannot leak/re-add account cart unexpectedly |
| Guest checkout | No User created; guest fields/lines validated and prices server-derived; inventory/order atomicity; two-hour capability cookie/header, expiry/tampering/wrong order/wrong email rejected |
| Authenticated checkout | Existing ID ownership, cart equality, optional valid address, foreign address rejection, account cart clearing; unverified behavior unchanged; client auth-loading race covered |
| Orders | Owner-only API/list/detail, foreign/anonymous access denied, guest not claimed by matching email; static confirmation not used as payment proof |
| PayPal | Create/capture/sync for account and guest; return after auth switch/logout/expiry; capability survives redirect; webhook works without session; invalid signature/reference/amount/currency denied; retries/concurrency do not duplicate payment or inventory effects |
| Deployment/rollback | Multiple Set-Cookie headers, secure external origin behind internal HTTP, trust/CSRF enforcement, no caching of /me/profile; rollback reads unchanged IDs/hashes; outstanding reset and guest links handled |
| Public catalog/content | Existing list/detail/category/brand/sitemap rendering and backend-failure behavior unchanged; no auth requirement or DB fallback introduced; reviews stay public and moderated |

## P. Risks/open questions

**Confirmed code risks:** rendered login transport is incompatible with NextAuth dispatch; logout menu is unmounted; address detail SSR lacks owner/session checks; verification/reset share untyped plaintext tokens; banned users are not blocked; password reset/logout do not revoke copied JWTs; email regex excludes valid address classes; cooldown/confirmation writes race; stale UserContext and non-idempotent local-cart merging; checkout address GET and address DELETE handlers missing. These require decisions and future fixes; none were modified in this audit.

**Unknown:** deployed revision equals this checkout; production schema/defaults/indexes and data match generated client; real password hash/casing/null-hash distributions; whether any historical Session/Account rows matter to other clients; externally used verification/subscription endpoints; actual email delivery and auth origin/cookie configuration; production payment and auth end-to-end success; acceptable logout/ban/recovery policy and cutover interruption. Backend audit's “no executable auth, schema may suffice” is supplied context; no backend implementation or schema change was attempted.

**Likely, requiring runtime confirmation:** current `/login` loops back without authentication; checkout saved-address fetch gets 405; standalone address SSR exposes another account's address to a caller who knows its ID. These follow inspected routing and handlers, but no exploit/live probe was performed.

### Concise migration report

- **Version/session:** NextAuth 4.24.7, Credentials only, configured PrismaAdapter 1.0.7, encrypted JWT sessions; Prisma Session unused by current auth flows.
- **Passwords:** bcryptjs 3.0.3, bcrypt cost 10, random salt, no pepper; existing hashes and User IDs can be preserved unchanged, subject to production-data verification.
- **Cookies:** `next-auth.session-token` / `__Secure-next-auth.session-token` (possible numbered chunks), callback-url and csrf-token cookies with prefixes listed in C; independent `guest_order_access`; retired `token`/`logged-in` cleanup. Customer lifetime 30 days, guest capability two hours.
- **Signup/verification:** signup UI auto-logs in via separate credentials call; endpoint alone returns empty 201. Verification gates neither login nor checkout. Banned flag is also ignored.
- **OTP/reset:** OTP login is retired (all four endpoints 410). Active reset emails one-hour plaintext tokens, updates bcrypt hash, deletes used token; no auto-login, redirect or session revocation. Reset/verification token purpose is not separated.
- **Sessions at migration:** no automatic JWT-to-opaque survival. Prefer one-time re-login after fixing actual login wiring; deliberate temporary JWE bridge is possible but adds complexity. Null-hash/phone-only accounts need recovery decisions.
- **Backend endpoints:** signup/login/logout/me plus active reset request/confirm; preserve verification request/confirm for exposed capability/link parity. No active OTP implementation required.
- **Commerce dependencies:** shared server/client identity helpers, UserContext/profile, guest-cart merge, wishlist, account order/address ownership, PayPal account-or-guest access and independent webhook authorization. Preserve guest tokens and in-flight payment returns.
- **Prisma remaining:** auth user/token/throttle/adapter; profile/addresses; wishlist/cart; checkout/orders/PayPal; subscriptions/reviews, plus content (full inventory K).
- **Scope confirmation:** only `docs/auth-storefront-audit.md` was created. No application code, schema, generated client, database, dependencies or other files were modified. No migrations, commits or pushes.
