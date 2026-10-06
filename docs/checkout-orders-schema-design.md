# Checkout + Orders: final additive schema and migration design

Design date: 2026-10-03. **Review artifact only. No migration or implementation file has been created, and no SQL has been executed.**

This document refines [the approved audit](checkout-orders-backend-audit.md) using the user's subsequent decisions. Those decisions supersede the audit's optional outbox/reservation suggestions: **no outbox, Notification redesign, Payment change, reservation/restoration lifecycle, or sale StockMovement is included.**

Canonical source: `../marihandmade-backend/prisma/schema.prisma` relative to the Web repository; Backend branch `feat/wishlist-backend`. Reviewed history: Backend `prisma/migrations/20260224200428_init`, `20260428143000_payment_user_optional`, `20270312120000_shipping_v1`, `20270502000000_enable_public_schema_rls`, `20270502000001_revoke_supabase_public_api_grants`, `20270502000003_revoke_public_schema_usage`, and `20270901000000_authenticated_cart`. Related reconciliation evidence is `../mariHandmade/production_reconciliation.sql`. None of these files is modified or proposed for replay.

## 1. Final proposed Prisma schema additions

**One new model; five new Order columns; four new OrderItem columns.** Existing columns, relationships, status enums, amounts, defaults, Cart partial indexes and CartMutationReceipt remain unchanged. No new PostgreSQL enum, guest model, worker, trigger function, sequence, or extension is needed.

The following is a proposed diff against canonical Backend `prisma/schema.prisma`, not an applied edit:

```diff
 model Order {
   // All existing scalar fields remain unchanged.
+  // NULL = historical/non-snapshot writer; 1 = complete v1 snapshot contract.
+  snapshotVersion             Int?
+  // Authenticated contact snapshots only. Guests use existing guest* fields.
+  customerEmailSnapshot       String?
+  customerNameSnapshot        String?
+  customerPhoneSnapshot       String?
+  shippingAddressSnapshot    Json? @db.JsonB

   // All existing relations remain unchanged.
+  creationReceipt OrderCreationReceipt? @relation("OrderCreationReceiptOrder")
 }

 model OrderItem {
   // All existing scalar fields and relations remain unchanged.
+  productTitleSnapshot String?
+  variantTitleSnapshot String?
+  skuSnapshot          String?
+  imageUrlSnapshot     String?
 }

+// SQL owns the scope/hash/version CHECK constraints and the deferred FK.
+// Prisma 5.22 cannot express the FK's DEFERRABLE INITIALLY DEFERRED timing.
+// Preserve that timing in every future reviewed SQL migration.
+model OrderCreationReceipt {
+  scopeKind       String
+  scopeId         String
+  operationId     String   @db.Uuid
+  requestHash     String   @db.VarChar(64)
+  contractVersion String
+  orderId         String   @unique(map: "OrderCreationReceipt_orderId_key")
+  createdAt       DateTime @default(now()) @db.Timestamp(3)
+  order           Order    @relation("OrderCreationReceiptOrder", fields: [orderId], references: [id], onDelete: NoAction, onUpdate: Cascade, map: "OrderCreationReceipt_orderId_fkey")
+
+  @@id([scopeKind, scopeId, operationId], map: "OrderCreationReceipt_pkey")
+}
```

The relation field `Order.creationReceipt` is optional so legacy Orders and old Admin/Payment consumers need no receipt. Receipt.order/orderId are **required**. No User relation is added. PostgreSQL uses the existing Order.id TEXT primary key. JSONB is supported by the canonical PostgreSQL datasource and Prisma 5.22's Json field; no generator/datasource/previewFeatures change is required.

Prisma and SQL agree on fields, types, nullability, default, relation name, FK actions, PK and unique-index names. The SQL-only CHECK constraints and **FK deferral timing** are deliberate additions that the Prisma schema cannot fully encode. They must not disappear in later introspection/generated-migration workflows. This is analogous to preserving the existing Cart SQL-only partial indexes, but does not change them.

## 2. Exact proposed incremental PostgreSQL migration SQL

**For review only. Do not execute.** This is standalone additive DDL against the verified current `public` baseline, not a repair/replay of archival history. It assumes the normal migration role/table-owner/private-runtime arrangement verified in section 10. If that arrangement differs, stop and review role grants before approving an actual migration file.

No `IF NOT EXISTS` is used for new columns/table/indexes: conflicting objects must fail loudly instead of silently accepting an incompatible partial migration. An explicit transaction prevents a half-applied design. Nullable columns have no DEFAULT; there is no UPDATE, backfill, column type conversion or existing-row rewrite. PostgreSQL still needs brief DDL locks; the local lock timeout bounds waiting rather than making deployment lock-free.

```sql
BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

ALTER TABLE public."Order"
  ADD COLUMN "snapshotVersion" INTEGER,
  ADD COLUMN "customerEmailSnapshot" TEXT,
  ADD COLUMN "customerNameSnapshot" TEXT,
  ADD COLUMN "customerPhoneSnapshot" TEXT,
  ADD COLUMN "shippingAddressSnapshot" JSONB;

ALTER TABLE public."OrderItem"
  ADD COLUMN "productTitleSnapshot" TEXT,
  ADD COLUMN "variantTitleSnapshot" TEXT,
  ADD COLUMN "skuSnapshot" TEXT,
  ADD COLUMN "imageUrlSnapshot" TEXT;

CREATE TABLE public."OrderCreationReceipt" (
  "scopeKind" TEXT NOT NULL,
  "scopeId" TEXT NOT NULL,
  "operationId" UUID NOT NULL,
  "requestHash" VARCHAR(64) NOT NULL,
  "contractVersion" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OrderCreationReceipt_pkey"
    PRIMARY KEY ("scopeKind", "scopeId", "operationId"),

  CONSTRAINT "OrderCreationReceipt_scopeKind_check"
    CHECK ("scopeKind" IN ('USER', 'GUEST')),

  CONSTRAINT "OrderCreationReceipt_scopeId_check"
    CHECK (
      char_length("scopeId") BETWEEN 1 AND 100
      AND "scopeId" = btrim("scopeId")
      AND (
        "scopeKind" <> 'GUEST'
        OR "scopeId" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      )
    ),

  CONSTRAINT "OrderCreationReceipt_requestHash_check"
    CHECK ("requestHash" ~ '^[0-9a-f]{64}$'),

  CONSTRAINT "OrderCreationReceipt_contractVersion_check"
    CHECK (
      char_length("contractVersion") BETWEEN 1 AND 64
      AND "contractVersion" = btrim("contractVersion")
    ),

  CONSTRAINT "OrderCreationReceipt_orderId_fkey"
    FOREIGN KEY ("orderId")
    REFERENCES public."Order" ("id")
    ON DELETE NO ACTION
    ON UPDATE CASCADE
    DEFERRABLE INITIALLY DEFERRED
);

CREATE UNIQUE INDEX "OrderCreationReceipt_orderId_key"
  ON public."OrderCreationReceipt" ("orderId");

ALTER TABLE public."OrderCreationReceipt" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."OrderCreationReceipt" FROM PUBLIC;

DO $private_grants$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE public."OrderCreationReceipt" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE public."OrderCreationReceipt" FROM authenticated;
  END IF;
END
$private_grants$;

COMMIT;
```

There are **no new snapshot CHECK constraints or triggers on existing Orders/OrderItems**. This keeps the existing-table change to nullable metadata-only column additions. The future Backend validates version 1, JSON shape and snapshot completeness before insertion and omits all snapshot fields from update commands. Metadata-only does not mean zero catalog changes/locks or zero WAL; it means no historical business values are transformed.

No global RLS/policy/grant sweep, schema-level grant change, NOTIFY, forced RLS, or named runtime-role grant is included. No permission is removed from existing tables. This mirrors the deployed Cart receipt migration's new-table hardening only.

## 3. Receipt key, constraint and index design

### Exact inventory

| Object | Type / semantics |
| --- | --- |
| `public.OrderCreationReceipt` | Ordinary durable table; seven non-null columns, no surrogate ID |
| `OrderCreationReceipt_pkey` | Immediate composite PK `(scopeKind,scopeId,operationId)`; implicit unique btree index of the same name |
| `OrderCreationReceipt_orderId_key` | Immediate unique btree index on non-null orderId; enforces one creation receipt per Order and also supports FK lookup/deletion checks |
| `OrderCreationReceipt_orderId_fkey` | Validated FK to existing Order.id, DELETE NO ACTION, UPDATE CASCADE, DEFERRABLE INITIALLY DEFERRED |
| `OrderCreationReceipt_scopeKind_check` | USER or GUEST only |
| `OrderCreationReceipt_scopeId_check` | Bounded nonblank trimmed scope; guest scope must be canonical lowercase UUIDv4 |
| `OrderCreationReceipt_requestHash_check` | Exactly 64 lowercase hexadecimal SHA-256 characters |
| `OrderCreationReceipt_contractVersion_check` | Nonempty trimmed version identifier, at most 64 characters |

`orderId_key` is a **unique index**, not a separate `pg_constraint` UNIQUE entry; this matches Prisma's usual `@unique` SQL representation. The PK is a constraint and creates its own backing index. No additional orderId, scope-only, createdAt or requestHash index is needed: replay is an exact PK lookup; one creation command maps to one Order; there is no receipt-search or expiry-cleanup API. An operationId may repeat in another authorized scope without collision. Hash/version are not part of the key, otherwise conflicting reuse could create a second receipt instead of a conflict.

### Why constrained text rather than a new enum

Use String/TEXT plus CHECK for scopeKind. USER/GUEST is a private command discriminator, not a new cross-domain business enum. It avoids introducing another PostgreSQL type into already non-linear enum history, remains easy to inspect/review, and still rejects unsupported values in SQL. Prisma exposes String; the Backend's strict runtime schema restricts the same two literals. A future new scope requires reviewing the CHECK and API explicitly.

### USER scope

`scopeKind='USER'`, `scopeId=authenticated Backend User.id` exactly, derived only from authenticated session identity. Never accept scopeId/userId from request JSON or identity headers; never use email, name, token or session ID.

The scope remains an opaque TEXT identity **without a User FK**. Receipt is retained independently of account deletion and session expiry; a User-FK cascade would destroy successful replay safety. Its durable business FK is to Order. Existing Order.userId remains the optional User relationship. A deleted account's receipt remains, but is not accessible by another account or by recreating the same email. User IDs must not be deliberately recycled. No guest conversion or email-based recovery is inferred from a null Order.userId.

### GUEST scope, no Guest model

`scopeKind='GUEST'`, `scopeId=canonical lowercase random UUIDv4`. Backend mints a secure random identity before the Order POST and authenticates it via a signed, HttpOnly, production Secure cookie; the identity is stable across preview/retry. Store the UUID only, not the raw cookie/HMAC or email. The scopeKind distinguishes it from any coincidentally identical User ID.

A stateless signed cookie is enough; no Guest table or fake User/Address is needed. Use a distinct versioned token purpose/domain from the existing order-payment capability. Cookie scope verification precedes receipt lookup. Generate/validate before commit, never after stock consumption. A missing/malformed/expired guest scope must not silently mint a replacement during a replay attempt; it must fail safely and preserve the pending browser intent.

The existing payment capability remains `{orderId,guestEmail,iat,exp}` with its established verifier/cookie/header compatibility. It is distinct from the pre-order guest scope. Receipt-key possession or guest email alone is not order authorization. A signing-secret rotation/expiry policy must preserve accepted pending scope tokens for their intended validity period or fail closed; this needs no DB model and no configuration is made here.

### Required orderId and claim-before-create

Recommended sequence within one Serializable transaction:

1. Derive authorized scope and normalize submitted intent.
2. Read receipt by composite PK. If present, verify contract/fingerprint and scope-to-order authorization, then return the **same Order** without rerunning checkout/stock/cart writes.
3. If absent, allocate the future Order.id using the same cuid-compatible generation convention already used by Order. Do not change Order.id's type/default and do not expose this provisional ID before commit.
4. Insert receipt with this **non-null provisional orderId**, using scalar foreign-key data. The deferred FK permits the referenced Order to be created later in this transaction. A Prisma nested `connect` to a not-yet-existing Order would be wrong; the future repository should use the scalar/unchecked create path.
5. Perform the approved authoritative validation/stock/Order/items/snapshot/cart operations and create Order with that exact preallocated id.
6. Completion is the presence of that linked Order in the same transaction, not a receipt status update. Let the deferred FK validate at commit. There is no nullable claim/status/completedAt field.

An exception rolls everything back. Committing a receipt without its linked Order fails the FK; committing orderId=NULL fails NOT NULL. No incomplete **unlinked** receipt can become durable. The FK does not independently prove correct pricing, ownership, item completeness or snapshots; those remain transaction/service invariants and require the later isolated PostgreSQL tests.

NO ACTION is chosen instead of DELETE CASCADE/SET NULL: an Order cannot be deleted and committed while its receipt remains, and deleting an Order does not automatically erase the key. The deferred check allows the short claim-before-create sequence. UPDATE CASCADE preserves the link if a privileged writer changes an Order PK; normal app commands must never change IDs. Receipt rows are never automatically deleted, reassigned or overwritten.

The PK and unique index remain immediate; only the FK is deferred. This preserves uniqueness arbitration for concurrent receipt claims. Retry only rolled-back serialization/deadlock conditions handled by the agreed service and **receipt-key-specific** uniqueness races, then reread the same receipt; do not treat arbitrary P2002/P2003/P2025 as success. A unique orderId collision from faulty ID generation is not a same-key replay.

Alternative nullable orderId + ordinary FK is simpler for generated migrations, but SQL would permit unfinished receipts to commit unless adding a deferred completion trigger/function or relying solely on application discipline. The selected non-null/deferred-FK design provides the required linkage guarantee with fewer objects. It must be kept as reviewed custom SQL and verified against Prisma 5.22 in the future disposable-DB implementation tests.

PostgreSQL documents deferred FK checks and the difference between NO ACTION and RESTRICT in [CREATE TABLE](https://www.postgresql.org/docs/16/sql-createtable.html). Prisma's schema does not encode every database feature, and cuid is an ORM-side default rather than a PostgreSQL default; see [Prisma unsupported database features](https://www.prisma.io/docs/orm/prisma-schema/data-model/unsupported-database-features). The linked Prisma page currently documents newer versions; the concrete proposed model targets the repository's 5.22 types, and requires future version-specific integration verification rather than assuming current documentation proves runtime behavior.

### Retention and replay result

Keep successful key/hash/version/Order linkage for long-term replay safety; no TTL/delete job. Replay still requires valid current authorization. Guest token expiry is an access boundary, not permission to reuse an old key as a new purchase. Do not reassign a failed response a fresh guest identity/key and call it a retry.

Receipt stores no raw request or response, contact values, payment provider identifiers or price copy. Immutable amounts and snapshots already live on Order/items. Return the same Order.id/number/committed amounts; current payment/status may have changed and must not be interpreted as a new creation. A newly signed guest payment capability may be reissued only to an authorized same-scope replay after verifying the guest Order. Best-effort OrderCreated emails run only after an actual new commit, never merely because a receipt was replayed. This provides replay-safe business mutation, not guaranteed email delivery.

## 4. Fingerprint contract: checkout-orders-v1

The service supplies `contractVersion='checkout-orders-v1'`. The caller cannot supply contractVersion, scopeKind or scopeId. Compute lowercase hex SHA-256 of the UTF-8 bytes of `JSON.stringify` of this exact **array**:

```text
[
  "checkout-orders-v1",
  scopeKind,
  [[productId, variantIdOrNull, quantity], ...sortedMergedLines],
  authenticatedAddressIdOrNull,
  discountCodeOrNull,
  guestContactOrNull
]
```

For USER, final element is null. For GUEST, it is `[email,firstName,lastName,phoneOrNull]` and address element is null. ScopeId/operationId are in the PK, not the fingerprint. The scopeKind is included for semantic domain separation.

Normalization is precise:

1. Strict request objects/nested objects; reject unknown keys and any caller price/subtotal/total/tax/payable/status/inventory/ownership fields. Authenticated payload rejects guest contact; guest payload rejects authenticated address selection. There is no financial input in the hash.
2. `checkoutLines` contains 1–100 submitted lines; productId/variantId are nonempty exact-trimmed strings <=100 characters. Omitted/null variantId becomes null. Do not lowercase, Unicode-normalize or silently trim IDs.
3. Quantity must be a numeric safe integer from 1 through 2,147,483,647. Merge identical `(productId,variantId|null)` **tuples**, not concatenated delimiter strings; reject merged overflow/out-of-range quantity. Sorting is ascending UTF-8 byte order by productId, then variantId, with null before non-null. Line order/duplicate splitting do not change intent.
4. AddressId omitted/null/empty becomes null; otherwise exact-trimmed nonempty ID <=100. Guest never connects it. Ownership validation happens separately inside the transaction.
5. DiscountCode omitted/null/empty becomes null; otherwise preserve the exact nonempty case-sensitive string as submitted (bounded to 100 characters). Do not lowercase/trim a valid code and alter the current exact code-lookup behavior. Coupon eligibility/usage is authoritative DB logic, not fingerprint normalization.
6. Guest email uses the existing trim + locale-independent lowercase semantics; first/last names use existing trim semantics; phone trimmed empty/omitted/null becomes null. Internal spaces/Unicode are preserved, not collapsed or normalized. Validate the existing email semantics and bounded contact strings before hashing. No contact exists in USER fingerprint: live account name/email/phone updates do not invalidate recovery of an already-created Order.
7. The root/line/contact values are arrays with fixed ordering; no object-key canonicalization or locale sort is involved. Hash current normalized **submitted intent**, never current cart contents, DB prices, stock, address content, User data, session cookie or PayPal ID.

Same authorized PK + same supported version/hash returns the same Order even if cart is now empty, inventory is now zero or the selected Address was later edited. Same PK + different version/hash returns IDEMPOTENCY_CONFLICT; never overwrite the stored hash. Existing receipts must be found before revalidating today's cart/product/address eligibility. Future contract changes must retain a version-aware replay normalizer for existing keys or safely reject unsupported/conflicting intent; never reinterpret a v1 key as a new purchase.

Different scopes with the same operationId are separate intents. USER scope always comes from session identity; GUEST cookie identity is separately authenticated. A hash is an integrity fingerprint, **not a secret, authorization token or guarantee that contact data cannot be guessed**. Do not log it with raw contact/credentials.

## 5. Order snapshot field design

| New Order column | SQL / nullability | Meaning for a new v1 Order |
| --- | --- | --- |
| snapshotVersion | INTEGER NULL, no default | Explicitly 1 only after the complete v1 facts are assembled; legacy/default old writer leaves NULL |
| customerEmailSnapshot | TEXT NULL, no default | Authenticated User.email at creation, possibly null |
| customerNameSnapshot | TEXT NULL, no default | Authenticated User.name at creation, possibly null; do not invent first/last splitting |
| customerPhoneSnapshot | TEXT NULL, no default | Authenticated User.phone at creation, possibly null |
| shippingAddressSnapshot | JSONB NULL, no default | Selected authenticated owned Address at creation; NULL when no Address selected or for current guest flow |

Existing guestEmail/guestFirstName/guestLastName/guestPhone are already contact snapshots for guests and remain the authoritative guest source for new v1 Orders. Do **not** copy those same values into the three new customer fields. Guests therefore have those three new columns NULL, existing guest* columns populated as today, userId NULL and shipping snapshot NULL. Authenticated v1 Orders populate only customer* snapshots and existing User FK; guest* remain NULL.

snapshotVersion is necessary: a new authenticated account may legitimately have null phone/name/email, and a new Order may have no shipping Address. Null contact/address fields alone cannot distinguish "absent at purchase" from "legacy snapshot unavailable". One Order-level marker covers contact/address and all nested item snapshots, avoiding per-item version columns or duplicated presence booleans. No new DB default of 1: old writers must never silently claim snapshot completeness.

### Shipping representation: JSONB recommended

| Alternative | Assessment |
| --- | --- |
| Nullable scalar country/address/city/postalCode/phone snapshot columns | Strong individual SQL typing/easy direct selects, but adds five columns plus presence/version semantics and partial-value cases; historical migration expansion for each new address field. No approved search/index use needs those scalars. |
| One nullable JSONB snapshot | One additive column; natural DTO object; strict Backend validation/version contract controls keys; missing entire address is SQL NULL; supports historical read without following mutable Address. Prisma 5.22 compatible. Recommended minimum. |

Exact version-1 JSON object, with all five string keys and no unknown keys:

```json
{
  "country": "IRI",
  "address": "Captured street/address text",
  "city": "Captured city",
  "postalCode": "Captured postal code",
  "phone": "Captured address phone"
}
```

Values come only from the owned Address row read inside the Order transaction. Preserve its business text and existing validation; do not introduce mandatory country normalization or use placeholders shown above as data. Phone here is the shipping Address contact; customerPhoneSnapshot is account contact, and they can legitimately differ. Recipient identity comes from the Order contact source; current Address has no separate recipient-name field.

Use database SQL NULL (`Prisma.DbNull` in the eventual Prisma write where needed), **not JSON literal null or an empty object**, for no snapshot. Backend validates the exact v1 shape before writing/reading a committed snapshot; malformed data on a v1 Order is an integrity error, not a reason to substitute today's mutable address. No JSON indexes, key CHECK functions, JSON schema extension or query engine is needed. Future address shape changes use an explicit new snapshot version, not a reinterpretation of stored v1 objects.

All facts are append-at-creation and immutable through normal app commands. No SQL immutability triggers are introduced; the trusted Backend must omit snapshot fields from every update path and future tests must prove this. Privileged DB writers can still change values; this design does not claim otherwise.

Keep existing addressId/userId FKs unchanged for Admin and payments. A later address edit does not affect new history; a later permitted FK detachment does not erase snapshot. Account deletion does not convert contact snapshot to a guest capability or change scope authorization.

## 6. OrderItem snapshot field design

| New OrderItem column | SQL / nullability | Source at commit |
| --- | --- | --- |
| productTitleSnapshot | TEXT NULL, no default | Authoritative Product.title; required by the v1 service even though DB column is nullable for legacy |
| variantTitleSnapshot | TEXT NULL, no default | Selected Variant.title when applicable; legitimate null otherwise |
| skuSnapshot | TEXT NULL, no default | Selected Variant.sku when applicable; null for genuine variantless legacy products |
| imageUrlSnapshot | TEXT NULL, no default | Representative validated product image URL when available; null if none |

Representative image selection matches current Web checkout `src/app/api/checkout/route.ts::getCoverImage`: cover ProductImage first, otherwise first ordered ProductImage, otherwise first legacy Product.images URL, otherwise null. The future Backend should make ties deterministic (position then stable image identity) and validate allowed URL handling; never store a caller-selected URL as authority. Snapshot stores the URL string, not a copied image asset. The remote image can disappear; storage of URL does not guarantee permanent media availability.

Existing productId, variantId, count, price and discount stay unchanged. Count/price/discount are already financial facts; do not duplicate them in snapshot JSON or add an OrderItem currency field. No Product/Variant FK is dropped, weakened or renamed.

For a new Order with snapshotVersion=1:

- Product renamed → productTitleSnapshot remains the purchase title.
- Variant renamed or deleted with existing FK SET NULL → title/SKU snapshots remain; null variantId later does not mean the line was originally variantless.
- Product images change → stored representative image URL stays the purchase URL, subject to remote-asset availability.
- Product becomes unpublished → order history still uses its snapshots, not public Catalog eligibility. Product required FK may prevent deletion; nothing here changes that constraint.
- Optional variant title/image/SKU null → retain null; do not fill with mutable values later. Missing productTitleSnapshot on a v1 Order is an integrity failure; do not label it legacy to hide an incomplete writer.

No item-level version field is needed because Orders creation always creates its snapshot items atomically and Order.snapshotVersion selects the read contract. If a future feature edits/replaces items, it must preserve the same immutable contract or be designed separately.

## 7. Legacy read behavior

| Classification | Read rule |
| --- | --- |
| Order.snapshotVersion=1 | Snapshots and existing guest contact facts are authoritative. Never substitute live User/Product/Variant/Address for missing optional values. Label sources COMMITTED; no selected address is NONE. |
| Order.snapshotVersion IS NULL | Legacy/non-snapshot writer. Contact/address/items may use explicit allowlisted live-data fallback **for presentation only**, with LEGACY_CURRENT source labeling. Existing guest* facts can be displayed without querying a User. |
| Unsupported non-null version or malformed v1 facts | Safe unavailable/integrity error and internal stable diagnostic code; do not silently fall back. |

For legacy authenticated contact fallback, a narrow User select (name/email/phone only) can be used server-side; never serialize User. For legacy product/variant/address fallbacks, use only necessary presentation fields, never price/inventory repricing or public eligibility checks to rewrite historical totals. A missing/deleted live relation yields null/unavailable labels honestly. Do not mix one v1 missing optional scalar with today's live value.

The migration leaves all nine new snapshot columns NULL on historical rows without a backfill. Existing raw include-based Admin/payment queries may ignore them. Future old writers also leave snapshotVersion NULL; this is honest classification, but the final Backend cutover must ensure new storefront Orders always follow v1 rather than using the legacy writer indefinitely.

## 8. RLS and private grant design

Match Backend `prisma/migrations/20270901000000_authenticated_cart/migration.sql`: enable RLS on the **new receipt table only**, revoke PUBLIC/anon/authenticated table access, and create no browser/Supabase policies. Do not reapply the historical global policy-dropping migrations or change existing Order/OrderItem RLS/ACLs.

Do not FORCE ROW LEVEL SECURITY: existing trusted Prisma ownership/BYPASSRLS arrangement must continue. The new table is owned by the role executing CREATE TABLE. The runtime role must either own it (directly or via verified owner-role privileges), or have BYPASSRLS/superuser behavior **and the necessary table privileges**. BYPASSRLS alone does not grant table access. An unrelated SQL Editor role is not proof of runtime access.

No speculative `GRANT ALL TO service_role` or public SELECT policy is added. Preflight must identify the actual Backend connection role and how deployed CartMutationReceipt is accessible. If runtime is a distinct role without appropriate inherited/default grants, this exact proposal is **not deployable unchanged**: review a narrowly targeted `GRANT SELECT, INSERT ON public."OrderCreationReceipt" TO <verified runtime role>` and applicable RLS-bypass arrangement before finalizing the migration file. The selected required-orderId design needs no routine receipt UPDATE/DELETE. Do not grant a non-bypass role permissions and assume deny-all RLS will permit it.

Inherited/default grants to other roles must be inspected. The conditional revokes secure known API roles; unusual role memberships/default ACLs can still defeat effective isolation and are a deployment blocker, not a reason to guess production role names. The new table has no sequence requiring grants. New columns inherit existing Order/OrderItem privileges; restrictive column-specific SELECT grants may affect older clients that select all scalars and must be checked.

## 9. Compatibility analysis

- **Admin:** existing model fields/FKs stay intact; new columns are nullable, no default or changed existing nullability. Older generated clients select only known fields and continue working. Broad raw `SELECT *` exports will see added nullable fields; inspect/report consumers before rollout, not redesign Admin.
- **Current PayPal:** existing Order ID/number/totals/status/isPaid/contact/User/item/Product/Variant relations remain. Reconciliation still writes only payment/order status; no new stock mutation or payment schema change. Existing guest capability verifier remains compatible. Snapshot fields are not required inputs to current PayPal code. PayPal may still read live item labels until its own milestone; the snapshot design permits correcting that later.
- **Cart:** no new Cart/CartItem field, FK, index or receipt change. Keep authenticated Cart partial SQL indexes and CartMutationReceipt untouched, including replay behavior after consumption.
- **Inventory/money:** no inventory/reservation/movement/amount/currency columns or defaults change. Future commit preserves tracked onHand decrement, reserved-quantity validation, untracked skip, approved backorders, true legacy Product.stock, 9% tax, shipping 0, current product/coupon behavior and operational EUR. Payments/USD inconsistency is not resolved by this schema.
- **Notifications/email:** Notification model unchanged; do not emit the invalid Owner.id→User FK write. Owner/customer emails remain post-commit best-effort; no schema for delivery/retries/outbox. Lost response can replay Order without resending creation emails; a crash around best-effort send may lose mail, which is accepted here.
- **Prisma/history:** preserve SQL-only deferral/CHECKs in reviewed migration tooling. Do not use db push to infer/recreate these features. Non-linear shipping/reconciliation history must be verified at deployment, not normalized by this proposal.

## 10. Exact read-only production preflight SQL — manual review only

**Do not execute in this task.** These queries read metadata and migration-ledger identifiers/checksums only. They never select Order/customer contact values, snapshot contents, inventory values or the known smoke Order. No SELECT below targets business rows. Replace the runtime-role string where indicated with the independently verified connection role name, not credentials. Do not export secrets or migration logs.

### 10.1 Required relations and nullable/default/type baseline

```sql
BEGIN TRANSACTION READ ONLY;

SELECT current_database() AS database_name,
       current_user AS inspection_role,
       current_setting('server_version') AS server_version;

WITH required(name) AS (
  VALUES ('User'), ('Order'), ('OrderItem'), ('Address'), ('Product'),
         ('ProductVariant'), ('Cart'), ('CartItem'), ('CartMutationReceipt'),
         ('_prisma_migrations')
)
SELECT name,
       to_regclass(format('public.%I', name)) AS relation
FROM required
ORDER BY name;

SELECT c.relname AS table_name, a.attnum AS ordinal_position,
       a.attname AS column_name,
       format_type(a.atttypid, a.atttypmod) AS data_type,
       a.attnotnull AS not_null,
       pg_get_expr(d.adbin, d.adrelid) AS column_default,
       a.attidentity AS identity_kind,
       a.attgenerated AS generated_kind
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid
LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
WHERE n.nspname = 'public'
  AND c.relname IN ('Order', 'OrderItem', 'User', 'Address',
                   'Product', 'ProductVariant', 'CartItem', 'CartMutationReceipt')
  AND a.attnum > 0 AND NOT a.attisdropped
ORDER BY c.relname, a.attnum;

COMMIT;
```

Verify current canonical Order.id TEXT primary key, nullable userId/addressId/guest contact; OrderItem.id TEXT PK, required orderId/productId, optional variantId; existing defaults/nullability needed by current app; Cart receipt structure. Missing/incompatible baseline is a stop, not permission to patch it in this migration.

### 10.2 FKs, delete/update actions, PKs and other constraints

```sql
BEGIN TRANSACTION READ ONLY;

SELECT src.relname AS table_name, co.conname AS constraint_name,
       co.contype AS constraint_kind,
       dst.relname AS referenced_table,
       co.convalidated AS validated,
       co.condeferrable AS deferrable,
       co.condeferred AS initially_deferred,
       pg_get_constraintdef(co.oid, true) AS definition
FROM pg_constraint co
JOIN pg_class src ON src.oid = co.conrelid
JOIN pg_namespace ns ON ns.oid = src.relnamespace
LEFT JOIN pg_class dst ON dst.oid = co.confrelid
WHERE ns.nspname = 'public'
  AND (
    src.relname IN ('User', 'Order', 'OrderItem', 'Address', 'Product',
                   'ProductVariant', 'Cart', 'CartItem', 'CartMutationReceipt')
    OR co.confrelid IN (
      SELECT c.oid FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN ('User', 'Order', 'OrderItem', 'Address',
                         'Product', 'ProductVariant')
    )
  )
ORDER BY src.relname, co.conname;

SELECT t.relname AS table_name, i.relname AS index_name,
       x.indisprimary AS is_primary, x.indisunique AS is_unique,
       x.indimmediate AS uniqueness_is_immediate,
       x.indisvalid AS is_valid, x.indisready AS is_ready,
       pg_get_indexdef(i.oid) AS definition,
       pg_get_expr(x.indpred, x.indrelid) AS predicate
FROM pg_index x
JOIN pg_class t ON t.oid = x.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
JOIN pg_class i ON i.oid = x.indexrelid
WHERE n.nspname = 'public'
  AND t.relname IN ('Order', 'OrderItem', 'User', 'Address', 'Product',
                   'ProductVariant', 'Cart', 'CartItem', 'CartMutationReceipt')
ORDER BY t.relname, i.relname;

COMMIT;
```

Read definitions, not just names. Order.id referenced uniqueness must be valid/non-partial/immediate. Preserve actual existing FK behavior; any drift from canonical nullable/default actions requires established baseline review. Confirm both CartItem_variant_line_key `(cartId,productId,variantId) WHERE variantId IS NOT NULL` and CartItem_legacy_line_key `(cartId,productId) WHERE variantId IS NULL` are valid/ready/unique; obsolete cartId/productId uniqueness must not still block variants. Verify CartMutationReceipt composite PK and User FK. No Cart repair is proposed.

### 10.3 Proposed-name/column conflicts, including types and constraints

```sql
BEGIN TRANSACTION READ ONLY;

WITH proposed(name) AS (
  VALUES ('OrderCreationReceipt'), ('OrderCreationReceipt_pkey'),
         ('OrderCreationReceipt_orderId_key'),
         ('OrderCreationReceipt_orderId_fkey'),
         ('OrderCreationReceipt_scopeKind_check'),
         ('OrderCreationReceipt_scopeId_check'),
         ('OrderCreationReceipt_requestHash_check'),
         ('OrderCreationReceipt_contractVersion_check')
)
SELECT 'relation' AS object_kind, n.nspname AS schema_name,
       c.relname AS object_name, c.relkind::text AS detail
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN (SELECT name FROM proposed)
UNION ALL
SELECT 'constraint', n.nspname, co.conname,
       pg_get_constraintdef(co.oid, true)
FROM pg_constraint co JOIN pg_namespace n ON n.oid = co.connamespace
WHERE n.nspname = 'public' AND co.conname IN (SELECT name FROM proposed)
UNION ALL
SELECT 'type', n.nspname, t.typname, t.typtype::text
FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname IN ('OrderCreationReceipt', '_OrderCreationReceipt')
ORDER BY object_kind, object_name;

WITH proposed(table_name, column_name) AS (
  VALUES ('Order', 'snapshotVersion'),
         ('Order', 'customerEmailSnapshot'),
         ('Order', 'customerNameSnapshot'),
         ('Order', 'customerPhoneSnapshot'),
         ('Order', 'shippingAddressSnapshot'),
         ('OrderItem', 'productTitleSnapshot'),
         ('OrderItem', 'variantTitleSnapshot'),
         ('OrderItem', 'skuSnapshot'),
         ('OrderItem', 'imageUrlSnapshot')
)
SELECT p.table_name, p.column_name,
       format_type(a.atttypid, a.atttypmod) AS conflicting_type,
       a.attnotnull AS conflicting_not_null
FROM proposed p
JOIN pg_namespace n ON n.nspname = 'public'
JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = p.table_name
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = p.column_name
WHERE a.attnum > 0 AND NOT a.attisdropped
ORDER BY p.table_name, p.column_name;

COMMIT;
```

Both result sets must be empty before first deployment. A same-name index/table/view/type/constraint or existing column is a review stop. A previous successful application of this exact design should instead be verified through ledger/postflight, never tolerated with IF NOT EXISTS or duplicated migrations.

### 10.4 RLS, ACLs, default grants, roles and effective privileges

```sql
BEGIN TRANSACTION READ ONLY;

SELECT c.relname AS table_name,
       pg_get_userbyid(c.relowner) AS table_owner,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced,
       c.relacl AS explicit_acl
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('Order', 'OrderItem', 'User', 'Address', 'Product',
                   'ProductVariant', 'Cart', 'CartItem', 'CartMutationReceipt')
ORDER BY c.relname;

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('Order', 'OrderItem', 'Cart', 'CartItem', 'CartMutationReceipt')
ORDER BY tablename, policyname;

SELECT n.nspname AS schema_name, pg_get_userbyid(n.nspowner) AS schema_owner,
       CASE WHEN a.grantee = 0 THEN 'PUBLIC'
            ELSE pg_get_userbyid(a.grantee) END AS grantee,
       a.privilege_type, a.is_grantable
FROM pg_namespace n
CROSS JOIN LATERAL aclexplode(COALESCE(n.nspacl, acldefault('n', n.nspowner))) a
WHERE n.nspname = 'public'
ORDER BY grantee, privilege_type;

SELECT c.relname AS table_name,
       CASE WHEN a.grantee = 0 THEN 'PUBLIC'
            ELSE pg_get_userbyid(a.grantee) END AS grantee,
       a.privilege_type, a.is_grantable
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
WHERE n.nspname = 'public'
  AND c.relname IN ('Order', 'OrderItem', 'CartMutationReceipt')
ORDER BY c.relname, grantee, a.privilege_type;

SELECT c.relname AS table_name, at.attname AS column_name,
       CASE WHEN a.grantee = 0 THEN 'PUBLIC'
            ELSE pg_get_userbyid(a.grantee) END AS grantee,
       a.privilege_type, a.is_grantable
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute at ON at.attrelid = c.oid AND at.attnum > 0 AND NOT at.attisdropped
CROSS JOIN LATERAL aclexplode(at.attacl) a
WHERE n.nspname = 'public' AND c.relname IN ('Order', 'OrderItem')
ORDER BY c.relname, at.attnum, grantee, a.privilege_type;

SELECT pg_get_userbyid(d.defaclrole) AS default_grant_owner,
       n.nspname AS schema_name, d.defaclobjtype AS object_type,
       CASE WHEN a.grantee = 0 THEN 'PUBLIC'
            ELSE pg_get_userbyid(a.grantee) END AS grantee,
       a.privilege_type, a.is_grantable
FROM pg_default_acl d
LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
CROSS JOIN LATERAL aclexplode(d.defaclacl) a
WHERE d.defaclnamespace = 0 OR n.nspname = 'public'
ORDER BY default_grant_owner, schema_name, object_type, grantee;

-- Replace the literal below with the actual Backend DB role name, not a secret.
SELECT rolname, rolsuper, rolbypassrls, rolinherit, rolcanlogin
FROM pg_roles
WHERE rolname IN (current_user, 'anon', 'authenticated', 'service_role',
                  'REPLACE_WITH_BACKEND_DATABASE_ROLE')
ORDER BY rolname;

SELECT member_role.rolname AS member_role, parent_role.rolname AS granted_role,
       m.admin_option
FROM pg_auth_members m
JOIN pg_roles member_role ON member_role.oid = m.member
JOIN pg_roles parent_role ON parent_role.oid = m.roleid
ORDER BY member_role.rolname, parent_role.rolname;

SELECT r.rolname AS role_name, c.relname AS table_name,
       has_schema_privilege(r.oid, n.oid, 'USAGE') AS schema_usage,
       has_table_privilege(r.oid, c.oid, 'SELECT') AS can_select,
       has_table_privilege(r.oid, c.oid, 'INSERT') AS can_insert,
       has_table_privilege(r.oid, c.oid, 'UPDATE') AS can_update,
       has_table_privilege(r.oid, c.oid, 'DELETE') AS can_delete,
       has_table_privilege(r.oid, c.oid, 'REFERENCES') AS can_reference
FROM pg_roles r
CROSS JOIN pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('Order', 'OrderItem', 'CartMutationReceipt')
  AND r.rolname IN (current_user, 'anon', 'authenticated', 'service_role',
                    'REPLACE_WITH_BACKEND_DATABASE_ROLE')
ORDER BY r.rolname, c.relname;

COMMIT;
```

Role names/memberships/grants are metadata, not passwords. Deliberately never query pg_authid.rolpassword. Inspect inherited privileges and deny-all RLS expectations, runtime-role access and migration ownership/default grants together. Effective table privilege alone does not prove a row is accessible under RLS. Receipt should use the same verified private-runtime arrangement as CartMutationReceipt, not merely SQL Editor visibility.

### 10.5 Migration ledger/checksums

Run only after 10.1 confirms `public._prisma_migrations` exists; if it lives elsewhere or is absent, stop and review the established ledger location/baseline. Do not auto-create/baseline it. Do not select its logs column.

```sql
BEGIN TRANSACTION READ ONLY;

SELECT migration_name, checksum, started_at, finished_at,
       rolled_back_at, applied_steps_count
FROM public."_prisma_migrations"
ORDER BY started_at, migration_name;

WITH expected(migration_name, source_checksum) AS (
  VALUES
    ('20260224200428_init', 'b130d6ddcadaffedebe775d7ebea34005eac6ff13a2ad3dd7b5055f29757194e'),
    ('20260226065306_add_category_slug', '333d7f912e4ebd5f961bf2b58f70056f5d733a795a719faad0d789d96667b0cd'),
    ('20260303100253_add_product_bundle', '5a59587664430997c0061b7034325cbf72f4721a7309e81e2e2543b0b66d97b3'),
    ('20260421130000_otp_hardening', '84596399cdb989bcfccdad1a7622d6f82423766de69607f065adeea34afd2a54'),
    ('20260428143000_payment_user_optional', '13b62b77333bdd26f99bd1a5128eee0e092a2250b58bda92a0f766d8d7ae4a82'),
    ('20270312120000_shipping_v1', '04d6240fad77f8e036ddd3023c8eb5932287c26a1065633558c72aa099db91e0'),
    ('20270325121500_home_visuals', 'd8a5d6c054cc5c0e2c77a26c682067f6347ad5b6ef9ff4bb713f6e122d417787'),
    ('20270325121501_add_product_reviews', '87691c5d57ff862ba21a024f855c0f7bb03ba523804db7fc53e97a0f145c5889'),
    ('20270502000000_enable_public_schema_rls', '9fadb6ff33808727ee50381dd172a5affaf126de4069aa81deaca0c55e955105'),
    ('20270502000001_revoke_supabase_public_api_grants', '20e3422655f7e39d77de62ccd06ba4f51f80ece8f74deb094a3a6773f2cb34d2'),
    ('20270502000002_owner_otp_hardening', 'eeeb2937b3806001b83715067bd3ca89bb00d7fd7a471f8f814436bbe96bd4ca'),
    ('20270502000003_revoke_public_schema_usage', 'f79a4c88394f36934831b3fde0ee13cd364c3cef7805b7b2d8cbffb49aa45108'),
    ('20270901000000_authenticated_cart', '61b4d7b024e3acf7aac7415189662f49b144f24aa777b231a34e5496723ca167')
)
SELECT COALESCE(e.migration_name, m.migration_name) AS migration_name,
       e.source_checksum, m.checksum AS ledger_checksum,
       m.finished_at, m.rolled_back_at,
       CASE
         WHEN e.migration_name IS NULL THEN 'LEDGER_ONLY_REVIEW'
         WHEN m.migration_name IS NULL THEN 'SOURCE_ONLY_REVIEW'
         WHEN m.checksum <> e.source_checksum THEN 'CHECKSUM_MISMATCH'
         WHEN m.rolled_back_at IS NOT NULL THEN 'ROLLED_BACK_REVIEW'
         WHEN m.finished_at IS NULL THEN 'UNFINISHED_REVIEW'
         ELSE 'SOURCE_CHECKSUM_MATCH'
       END AS review_state
FROM expected e
FULL OUTER JOIN public."_prisma_migrations" m USING (migration_name)
ORDER BY migration_name, m.started_at;

COMMIT;
```

Expected hashes were computed by reading local Backend migration.sql bytes with SHA-256 during this design, not by reading a database. Recompute against the exact reviewed release files before rollout. The comparison intentionally reports source-only/ledger-only rows; non-linear history means neither category is automatic permission to apply/replay/mark-resolved a migration. Check actual schema, archival shipping full CREATE statements, reconciliation evidence and the already deployed Cart ledger as an established baseline. Checksum match alone is not proof that manual reconciliation did not alter schema.

## 11. Post-migration verification SQL — do not execute now

After a separately approved deployment, rerun preflight baseline/FK/index/RLS/ledger metadata queries to compare preserved objects. Then run the following read-only metadata checks. No customer Order or receipt row values are returned.

```sql
BEGIN TRANSACTION READ ONLY;

SELECT c.relname AS table_name, a.attname AS column_name,
       format_type(a.atttypid, a.atttypmod) AS data_type,
       a.attnotnull AS not_null,
       pg_get_expr(d.adbin, d.adrelid) AS column_default
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
WHERE n.nspname = 'public'
  AND (
    c.relname = 'OrderCreationReceipt'
    OR (c.relname = 'Order' AND a.attname IN (
      'snapshotVersion', 'customerEmailSnapshot', 'customerNameSnapshot',
      'customerPhoneSnapshot', 'shippingAddressSnapshot'))
    OR (c.relname = 'OrderItem' AND a.attname IN (
      'productTitleSnapshot', 'variantTitleSnapshot', 'skuSnapshot', 'imageUrlSnapshot'))
  )
ORDER BY c.relname, a.attnum;

SELECT co.conname, co.contype, co.convalidated,
       co.condeferrable, co.condeferred,
       pg_get_constraintdef(co.oid, true) AS definition
FROM pg_constraint co
WHERE co.conrelid = 'public."OrderCreationReceipt"'::regclass
ORDER BY co.conname;

SELECT i.relname AS index_name, x.indisprimary, x.indisunique,
       x.indimmediate, x.indisvalid, x.indisready,
       pg_get_indexdef(i.oid) AS definition
FROM pg_index x JOIN pg_class i ON i.oid = x.indexrelid
WHERE x.indrelid = 'public."OrderCreationReceipt"'::regclass
ORDER BY i.relname;

SELECT c.relname, pg_get_userbyid(c.relowner) AS table_owner,
       c.relrowsecurity, c.relforcerowsecurity, c.relacl
FROM pg_class c
WHERE c.oid = 'public."OrderCreationReceipt"'::regclass;

SELECT policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'OrderCreationReceipt';

SELECT CASE WHEN a.grantee = 0 THEN 'PUBLIC'
            ELSE pg_get_userbyid(a.grantee) END AS grantee,
       a.privilege_type, a.is_grantable
FROM pg_class c
CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
WHERE c.oid = 'public."OrderCreationReceipt"'::regclass
ORDER BY grantee, a.privilege_type;

-- Replace runtime role name as in preflight.
SELECT r.rolname, r.rolsuper, r.rolbypassrls,
       has_schema_privilege(r.oid, 'public', 'USAGE') AS schema_usage,
       has_table_privilege(r.oid, 'public."OrderCreationReceipt"', 'SELECT') AS can_select,
       has_table_privilege(r.oid, 'public."OrderCreationReceipt"', 'INSERT') AS can_insert,
       has_table_privilege(r.oid, 'public."OrderCreationReceipt"', 'UPDATE') AS can_update,
       has_table_privilege(r.oid, 'public."OrderCreationReceipt"', 'DELETE') AS can_delete
FROM pg_roles r
WHERE r.rolname IN ('anon', 'authenticated', 'service_role', current_user,
                    'REPLACE_WITH_BACKEND_DATABASE_ROLE')
ORDER BY r.rolname;

SELECT c.relname AS table_name, i.relname AS index_name,
       x.indisvalid, x.indisready, x.indisunique,
       pg_get_indexdef(i.oid) AS definition,
       pg_get_expr(x.indpred, x.indrelid) AS predicate
FROM pg_index x JOIN pg_class c ON c.oid = x.indrelid
JOIN pg_class i ON i.oid = x.indexrelid
WHERE x.indrelid IN ('public."CartItem"'::regclass,
                      'public."CartMutationReceipt"'::regclass)
ORDER BY c.relname, i.relname;

-- Fill this literal only when an actual approved migration file is named.
SELECT migration_name, checksum, finished_at, rolled_back_at, applied_steps_count
FROM public."_prisma_migrations"
WHERE migration_name = 'REPLACE_WITH_APPROVED_MIGRATION_NAME';

COMMIT;
```

Expected: nine snapshot columns nullable with NULL/no default; seven receipt fields required, UUID operationId, VARCHAR(64) requestHash, timestamp(3) default CURRENT_TIMESTAMP. Six named receipt constraints (PK + FK + four CHECKs), all validated; only FK deferrable/initially deferred. Two valid ready immediate unique indexes (PK and orderId_key). Receipt RLS true, FORCE false, no policies, no effective PUBLIC/anon/authenticated table access; verified runtime can SELECT/INSERT under its RLS arrangement. Original Cart indexes/receipt intact. Ledger row successful and exact release-file checksum. Do not add a no-op data smoke or SELECT customer/receipt payloads to these metadata checks.

Receipt FK/uniqueness, same-key concurrency and snapshot completeness must additionally be exercised in a fresh disposable PostgreSQL database during authorized implementation. Those write tests are **not production postflight SQL and are not run here**.

## 12. Rollback / forward-fix strategy

- Failure inside the proposed DDL transaction rolls back all its changes. Lock timeout or name conflict is a safe stop; inspect/review, do not automatically retry with IF NOT EXISTS or erase conflicting objects.
- After migration but **before any new writer uses the additions**, leaving harmless nullable columns/empty receipt table in place is the preferred application rollback. A separately authorized removal could be considered only after proving no business facts/receipts/dependent app code exist; no reverse DROP SQL is supplied here.
- After real Orders use snapshots/receipts, retain them. Dropping them would destroy historical facts and long-term replay safety. Fix code/constraints forward with reviewed additive SQL, preserving receipt keys and mappings. Never update historical snapshots to current data to "repair" them.
- Application rollback must not revive old Web non-idempotent Order creation while requests have ambiguous outcomes. Prefer disable/drain submissions or roll back to a compatible idempotent implementation. Old Payment/Admin consumers may continue against additive schema; old order-creation writers bypass receipt guarantees and are a different risk.
- No rollback restores/changes inventory, deletes real Orders or clears successful receipts. Financial/stock corrections require a separate authorized process and are outside this design.

## 13. Risks and remaining gates

The schema decisions are finalized here: constrained-text scope, non-null preallocated orderId with deferred FK, opaque scopeId without User FK, unique Order mapping, three authenticated contact scalars, JSONB optional shipping, four item scalars and one Order-level version marker. No outbox or unrelated changes remain in the proposal.

Before implementation/release:

1. Review/approve this exact custom-SQL deferral design. Prisma 5.22 integration must prove scalar receipt insertion before Order creation and commit/rollback/concurrent replay behavior in an isolated database; a plain auto-generated FK would change the claim sequence.
2. Under **separate future read-only authorization**, verify actual baseline, migration ledger/checksums and migration/runtime roles. If runtime needs an explicit grant, the grant target/RLS arrangement must be reviewed before creating/applying the final migration file. No production role is guessed here.
3. Guest cookie lifetime/rotation/recovery policy and secure provisioning need an implementation contract; they do not require another DB model. A valid accepted scope must remain stable during the retry window; expired/lost scope fails safely rather than recreating the order. Existing payment-secret compatibility must be preserved without configuring it now.
4. Retention/deletion processes must exclude successful receipts and respect snapshots as immutable history. Scope identifiers/hashes are private data even without raw email. No cleanup worker is authorized.
5. Application assertions must enforce complete v1 snapshots, current ownership and exact cart intent. Database linkage constraints do not validate cross-model ownership or financial policy. No outbox means post-commit email loss is accepted; do not reinterpret that as a reason to retry Order creation with a new key.

No further business-policy choice is needed for the minimum schema. Implementation remains unauthorized; role/baseline verification is a **deployment gate**, not permission to query production during design.

## 14. Final recommendation

Approve the single `OrderCreationReceipt` table and nine nullable snapshot columns shown above, with the exact scoped PK, unique Order linkage, four CHECKs, deferred FK and new-table private hardening. Keep every existing commerce field/FK/index and all historical data unchanged. No backfill, new financial engine, payment/inventory/notification/outbox schema, fake guest records or historical migration normalization is proposed.

The only intended effects of a future approved migration are metadata additions and creation of an empty private receipt table/indexes/constraints. Future application writes populate facts for **new Orders only** within the approved Serializable transaction. This document is the review artifact; it is not a migration file or authorization to implement/deploy.
