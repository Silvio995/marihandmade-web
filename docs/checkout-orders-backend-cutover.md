# Checkout + Orders Backend cutover

Implementation is local and uncommitted on `feat/checkout-orders-backend-cutover` and Backend `feat/checkout-orders-backend`. Production/Supabase has not been accessed. The migration has **not** been applied remotely. The approved audit and schema-design documents remain review artifacts; this document records the implemented cutover.

## Ownership and HTTP boundary

Web `/api/checkout`, `/api/orders`, and `/api/orders/[orderId]` now forward to Backend. Checkout preview, pricing, publication/variant/inventory eligibility, Order/OrderItem writes, inventory consumption, owned Address selection, Cart consumption, snapshots and idempotency all belong to Backend. Profile order history/detail SSR uses `src/lib/server-orders.ts` with cookies and no-store HTTP, not Prisma.

`src/lib/checkout-orders-contracts.ts` defines strict explicit DTOs matching Backend contracts. Monetary wire values are two-decimal strings; persisted Float amounts remain compatible with existing Admin/Payments. Currency is EUR, product discount and aggregate 9% tax preserve previous order calculations; shipping is zero. No caller prices, totals, ownership IDs or order status are accepted.

The forwarding client has an eight-second timeout, rejects redirects and malformed/oversized upstream JSON, validates allowlisted responses, returns safe 503 for transport/internal errors, and preserves safe 400/401/403/404/409/413/415/429/503 codes without upstream messages. Browser POST Origin is checked and forwarded unchanged. Cookie, Content-Type and UUID Idempotency-Key are forwarded; ownership headers are not. Only Backend guest scope/payment-capability Set-Cookie names are forwarded. Private responses have no-store and Vary Cookie.

## APIs and DTOs

- GET `/api/checkout`: authenticated account Cart preview; no business writes.
- POST `/api/checkout`: `{checkoutLines:[{productId,variantId:null|string,quantity}]}`. Authenticated intent must equal the full Cart. Guest preview mints/reuses signed scope.
- POST `/api/orders`: required UUID Idempotency-Key, same identities/counts, optional authenticated addressId and discountCode, or required guest `{email,firstName,lastName,phone?}`. No preview money is submitted.
- GET `/api/orders?limit=20&cursor=...`: owner-only newest-first summaries and nextCursor, bounded limit 1–100.
- GET `/api/orders/:orderId`: authenticated owned safe detail; missing and another owner's order both 404.

Checkout DTO contains authoritative eligible lines, totals, EUR, readiness and safe line issues. Creation DTO contains id/number, stable creation status Pending/isPaid false, committed createdAt/payable and guest capability only for guest creation/replay. List/detail DTOs omit raw User, Payment, metadata and security fields. New snapshot facts are COMMITTED; legacy presentation fallbacks are explicitly LEGACY_CURRENT. Profile pages preserve redirects/notFound, shipping/items/date presentation, and render outage as an error rather than an empty history. History now paginates through “Altri ordini”.

## Durable browser operation

`src/lib/checkout-operation.ts` persists normalized intent, owner discriminator, UUID and submission/confirmation state in localStorage `mh-order-operation-v1`. It is saved before Order POST. Duplicate submission, lost response and refresh recovery use the same body/key. Recovery skips preview because Cart may already have been consumed and stock changed. The checkout button becomes “Riprendi ordine” for a saved submitted intent, including an empty current Cart. After confirmed creation it retries payment on the same Order. “Nuovo ordine” explicitly starts a new purchase after confirmation; unresolved ambiguous intent cannot be silently discarded for a changed intent.

Before submission a deliberately changed normalized intent receives a new key. Account/guest switch invalidates incompatible browser state, and an identity change during preview prevents the old intent from being posted. A synchronous submission guard supplements durable identity. Known rolled-back checkout validation errors permit correction; unknown/malformed/lost success preserves the operation. Saved intent contains required contact for recovery; no session secret/cookie is stored. A returned guest payment capability stays in memory and its HttpOnly compatibility cookie; the persisted confirmed result omits the bearer token. Same-scope replay renews it after refresh. Treat the saved contact/intent as same-origin private browser state.

Authenticated confirmed creation/replay refreshes Backend Cart. Guest cleanup is confirmed-only, rereads current local Cart and subtracts only purchased logical quantities, retaining surplus and unrelated additions. Cleanup and its operation marker share one Cart JSON write; subsequent guest edits retain that marker, so replay/crash recovery cannot subtract twice. Pending guest-to-account transfer remains guarded. Failed/unknown Order responses never clear Cart. This does not redesign the existing general cross-tab local Cart conflict policy.

## Guest and side effects

Backend genuine auth absence permits guest; malformed/expired/disabled customer cookies and auth infrastructure errors do not downgrade. Guest scope is signed random UUIDv4, HttpOnly, SameSite=Lax, Path=/, Secure in production, 30-day fixed lifetime. Scope has a distinct signing purpose from payment capability, requires existing-compatible GUEST_ORDER_TOKEN_SECRET, and expired/lost scope fails closed rather than creating a fresh scope for a pending Order. No Guest/User/Address records are invented. Guest Order userId/addressId/shipping snapshot remain null. Guest history/list-by-email is not introduced; payment status uses the existing order-specific capability.

Backend checks signing readiness before guest commit and reissues the existing two-hour `{orderId,guestEmail,iat,exp}` HMAC payment capability only for a verified same-scope replay. The subsequent Payments cutover moves verification of this capability to Backend.

Backend Order-created emails use a post-commit adapter with injectable transport, best-effort owner/customer delivery, bounded provider timeout and no replay send. Runtime delivery requires explicit existing `EMAIL_SEND_MODE=resend` plus valid sender/key; none was configured here. Default adapter performs no provider call. No Owner.id → Notification.userId write remains, no outbox/retry worker is introduced, and process crash/provider failure can lose email without affecting the committed Order.

## Payment ownership after the local PayPal cutover

Payment create/status/capture/sync now use thin Backend forwarding. The temporary webhook bridge relays raw JSON and signature headers to Backend. No payment route reads Prisma, validates guest HMAC, calls PayPal REST, sends payment emails, or reconciles financial state in Web. The unused `/pay` context endpoint and legacy provider/persistence helper are removed. Confirmation now reads authoritative Backend payment status, including cancellation and recovery.

The Orders source guard has no payment exceptions. Checkout still creates orders and consumes guest cart intent at the original commit boundary; payment pages do not consume cart or stock. Unrelated review/content/subscription/transitional account persistence and frozen generated Web Prisma infrastructure remain outside this milestone. See `payments-backend-cutover.md` for configuration and rollout gates.

## Validation and release gates

Offline suites cover forwarding cookies/Origin/key/Set-Cookie, safe failures/strict contracts, authenticated/guest UI, durable keys/ambiguous recovery/identity switch/exact cleanup, SSR reads and the Prisma source guard. Authoritative business and concurrency tests live in Backend. Final validation counts are recorded in the completion report.

Release remains separate: authorized metadata-only production preflight, ledger/checksum and runtime-role/RLS verification, SQL review and explicit deployment approval, migration then Backend/Web cutover, postflight and controlled smoke. Keep receipts/snapshots after use; do not roll back to unsafe legacy duplicate-order creation across ambiguous requests. Zero-stock production variants must remain unchanged and should reject purchase. No PayPal/Resend live test or production smoke was run.
